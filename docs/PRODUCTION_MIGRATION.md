# Production Migration Guide

## 1. OTP: Disable Debug Mode

### Current State
```env
OTP_DEBUG_MODE=true    # .env:50
```
- OTPs are returned in API responses as `debugOtp`
- `sendEmailOtp()` and `sendPhoneOtp()` return `true` without calling SendGrid/Twilio
- Real credentials exist in `.env` but are unused

### Production Change

```env
OTP_DEBUG_MODE=false   # Remove this line entirely, or set to false
```

When `false`:
- OTPs are **never** leaked in API responses
- `sendEmailOtp()` calls **SendGrid** `POST /v3/mail/send`
- `sendPhoneOtp()` calls **Twilio** `POST /2010-04-01/Accounts/{sid}/Messages.json`
- Both calls have an **8-second timeout**
- Failures return structured errors (502/503 with provider-specific codes)

### Credential Checklist

| Variable | Current Value | Production |
|---|---|---|
| `SENDGRID_API_KEY` | `SG.SCg5w...` | Replace with production API key (scoped to Mail Send) |
| `SENDGRID_FROM_EMAIL` | `ubaidullahakram1533@gmail.com` | Use a verified sender domain (`noreply@yourdomain.com`) |
| `TWILIO_ACCOUNT_SID` | `AC6aae5...` | Replace with production SID (upgraded account, not trial) |
| `TWILIO_AUTH_TOKEN` | `641a95...` | Replace with production auth token |
| `TWILIO_PHONE_NUMBER` | `+12295473592` | Replace with production number that can send to unverified numbers |

> **Trial account limitation**: Twilio trial accounts can only send SMS to **verified numbers** (error 21608). Production requires an **upgraded Twilio account** or all recipient numbers must be whitelisted in the Twilio console.

### OTP Expiry
Currently 60 seconds (`Date.now() + 60_000`). For production, increase to 3-5 minutes in `auth.service.ts`.

---

## 2. KYC Image Storage: Base64 JSON → Multipart → S3

### Current Architecture (Development)

```
Mobile → base64 JSON → Express JSON parser (50MB limit)
  → Mongoose: KycImage { url: "data:image/jpeg;base64,..." }
```
Base64 is used because React Native's multipart FormData is unreliable on Android. The backend **also** supports multipart (`req.file`), so both paths work.

### Production Architecture (Target)

```
Mobile → multipart with file binary → Multer → S3
  → Mongoose: KycImage { url: "https://cdn.domain.com/kyc/file.jpg" }
```

### Step 1: Switch Mobile to Multipart

**`mobile/src/services/kycService.ts`** — Change upload to try multipart first, fall back to base64:

```ts
import * as FileSystem from 'expo-file-system/legacy';

uploadImage: async (imageType: KycImageType, fileUri: string) => {
  // Try multipart first (required for S3 streaming)
  try {
    return await uploadMultipart(imageType, fileUri);
  } catch {
    // Fall back to base64 if multipart fails
    return await uploadBase64(imageType, fileUri);
  }
},
```

The `uploadMultipart` function uses `FileSystem.uploadAsync` (same approach that was tested in dev). The backend accepts both, so this is safe to deploy.

### Step 2: Backend → S3 via multer-s3

The backend already has the dual-path controller (accepts both multipart and base64). For production, replace multer's disk storage with S3:

```bash
npm install @aws-sdk/client-s3 multer-s3
```

**Replace `src/common/utils/upload.ts` with:**

```ts
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const kycMulter = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_KYC_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const userId = (req as any).auth?.userId || 'unknown';
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `kyc/${userId}-${Date.now()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadKycImage = kycMulter.single('image');

export const handleMulter = (req: Request, res: Response, next: NextFunction): void => {
  uploadKycImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds the 10MB limit' : err.message;
      return next(new AppError(message, 400, 'FILE_UPLOAD_ERROR'));
    }
    if (err) return next(err);
    next();
  });
};
```

### Step 3: Update Controller for Absolute URLs

The controller already returns different URL formats for multipart vs base64. For S3 multipart, the URL needs to be absolute:

```ts
// kyc.controller.ts — uploadImage handler
if (req.file) {
  const baseUrl = process.env.KYC_IMAGE_BASE_URL || '';
  const fileUrl = `${baseUrl}/kyc/${req.file.key}`;
  const result = await kycService.uploadImage(userId, imageType, fileUrl);
  return res.status(201).json({ ... });
}
```

### Step 4: Cleanup

Update `resolveAndCleanupImages()` to delete from S3 instead of disk:

```ts
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

// In resolveAndCleanupImages:
for (const img of images) {
  if (img.url?.includes('cdn.domain.com')) {
    const key = img.url.replace(`${process.env.KYC_IMAGE_BASE_URL}/`, '');
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_KYC_BUCKET,
      Key: key,
    }));
  }
}
```

---

## 3. Image Compression (Mobile)

Install:
```bash
npx expo install expo-image-manipulator
```

**In `kyc.tsx`**, compress before upload:
```ts
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const takePicture = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const compressed = await manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: SaveFormat.JPEG },
  );
  return { uri: compressed.uri };
};
```

---

## 4. Static File Serving Cleanup

When using S3, remove `express.static` for `/uploads` from `index.ts` and delete the `backend/uploads/` directory — it's no longer needed.

---

## 5. Disable Base64 Fallback in Production

The backend's dual-path controller (`req.file` or `req.body.data`) is useful during migration but in full production you may want to disable the base64 path to enforce efficient multipart uploads:

```ts
// kyc.controller.ts — uploadImage
if (req.file) { /* S3 upload */ }
if (data && process.env.NODE_ENV !== 'production') {
  // Allow base64 only in dev
}
throw new AppError('Multipart file upload is required', 400, 'VALIDATION_ERROR');
```

---

## 6. Environment Variables Summary

```env
# --- OTP ---
OTP_DEBUG_MODE=false
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# --- KYC Image Storage (S3) ---
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_KYC_BUCKET=your-app-kyc
KYC_IMAGE_BASE_URL=https://cdn.yourdomain.com
```

---

## 7. Order of Operations

```
1. Set OTP_DEBUG_MODE=false, verify SendGrid/Twilio credentials work
2. Create S3 bucket + IAM user with s3:PutObject, s3:DeleteObject, s3:GetObject
3. Add env vars, install @aws-sdk/client-s3 + multer-s3
4. Replace upload.ts with S3 version
5. Add mobile multipart-with-fallback logic (Step 1 above)
6. Update controller to return absolute URLs for S3
7. Update resolveAndCleanupImages() to use S3 delete
8. Add mobile image compression (expo-image-manipulator)
9. (Optional) Disable base64 fallback in production
10. Remove express.static('/uploads') and backend/uploads/ dir
11. Test full KYC flow end-to-end
```

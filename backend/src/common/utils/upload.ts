import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';

const KYC_UPLOAD_DIR = path.resolve('uploads/kyc');

if (!fs.existsSync(KYC_UPLOAD_DIR)) {
  fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true });
}

const kycStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, KYC_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = (req as unknown as Record<string, unknown>).auth
      ? ((req as unknown as Record<string, unknown>).auth as Record<string, string>).userId ?? 'unknown'
      : 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const kycMulter = multer({
  storage: kycStorage,
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
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size exceeds the 10MB limit', 400, 'FILE_TOO_LARGE'));
      }
      return next(new AppError(err.message, 400, 'FILE_UPLOAD_ERROR'));
    }
    if (err) return next(err);
    next();
  });
};

const RESUME_UPLOAD_DIR = path.resolve('uploads/resume');

if (!fs.existsSync(RESUME_UPLOAD_DIR)) {
  fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUME_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = (req as unknown as Record<string, unknown>).auth
      ? ((req as unknown as Record<string, unknown>).auth as Record<string, string>).userId ?? 'unknown'
      : 'unknown';
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `${userId}-resume-${Date.now()}${ext}`);
  },
});

const resumeMulter = multer({
  storage: resumeStorage,
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) return cb(null, true);
    cb(new AppError('Only PDF and DOC files are allowed', 400, 'INVALID_FILE_TYPE'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadResumeFile = resumeMulter.single('resume');

export const handleResumeUpload = (req: Request, res: Response, next: NextFunction): void => {
  uploadResumeFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size exceeds the 5MB limit', 400, 'FILE_TOO_LARGE'));
      }
      return next(new AppError(err.message, 400, 'FILE_UPLOAD_ERROR'));
    }
    if (err) return next(err);
    next();
  });
};

const AVATAR_UPLOAD_DIR = path.resolve('uploads/avatar');

if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = (req as unknown as Record<string, unknown>).auth
      ? ((req as unknown as Record<string, unknown>).auth as Record<string, string>).userId ?? 'unknown'
      : 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${userId}-avatar-${Date.now()}${ext}`);
  },
});

const avatarMulter = multer({
  storage: avatarStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadAvatarFile = avatarMulter.single('image');

export const handleAvatarUpload = (req: Request, res: Response, next: NextFunction): void => {
  uploadAvatarFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size exceeds the 10MB limit', 400, 'FILE_TOO_LARGE'));
      }
      return next(new AppError(err.message, 400, 'FILE_UPLOAD_ERROR'));
    }
    if (err) return next(err);
    next();
  });
};

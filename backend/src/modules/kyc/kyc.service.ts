import fs from 'fs/promises';
import path from 'path';

import { AppError } from '../../common/errors/AppError.js';
import UserModel, { type IUser } from '../auth/auth.model.js';
import KycImageModel from './kyc-image.model.js';
import KycDocumentModel, { type IKycDocument, type KycDocumentType, type KycStatus } from './kyc.model.js';

type KycSubmissionInput = {
  documentType: KycDocumentType;
  documentImageIds: { front: string; back?: string };
  livenessImageIds: { face_clear: string; move_left: string; move_right: string; smile: string };
  countryCode: string;
  notes?: string;
};

type KycReviewAction = 'approve' | 'reject';

const allowedProviderRoles = new Set<IUser['role']>(['pending', 'provider', 'admin']);

const assertProviderEligible = (user: IUser): void => {
  if (!allowedProviderRoles.has(user.role)) {
    throw new AppError('Only provider accounts can access KYC flows', 403, 'KYC_PROVIDER_REQUIRED');
  }
};

const assertAdmin = (user: IUser): void => {
  if (user.role !== 'admin') throw new AppError('Admin access required', 403, 'FORBIDDEN');
};

const getUserOrThrow = async (userId: string): Promise<IUser> => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return user;
};

const getLatestKycDocument = async (userId: string): Promise<IKycDocument | null> => {
  return KycDocumentModel.findOne({ userId }).sort({ createdAt: -1 });
};

const serializeDocument = (document: IKycDocument | null) => {
  if (!document) return null;
  const json = document.toJSON() as Record<string, unknown>;
  return {
    id: json._id,
    userId: json.userId,
    userRole: json.userRole,
    status: json.status as KycStatus,
    documentType: json.documentType,
    countryCode: json.countryCode,
    submittedAt: json.submittedAt,
    reviewedBy: json.reviewedBy ?? null,
    reviewedAt: json.reviewedAt ?? null,
    rejectionReason: json.rejectionReason ?? null,
    notes: json.notes ?? null,
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
};

const serializeStatus = (status: KycStatus | 'missing', document: IKycDocument | null, user: IUser) => ({
  user: { id: user.id, role: user.role, fullName: user.fullName, email: user.email },
  status,
  canAccessRestrictedActions: status === 'approved' && user.role === 'provider',
  latestDocument: serializeDocument(document),
});

const ensureLatestStatusAllowsSubmission = async (userId: string, mode: 'submit' | 'resubmit'): Promise<void> => {
  const latest = await getLatestKycDocument(userId);
  if (mode === 'submit') {
    if (latest?.status === 'pending') throw new AppError('KYC submission is already pending review', 409, 'KYC_ALREADY_PENDING');
    if (latest?.status === 'approved') throw new AppError('KYC has already been approved', 409, 'KYC_ALREADY_APPROVED');
  }
  if (mode === 'resubmit' && latest?.status !== 'rejected') {
    throw new AppError('KYC resubmission is only allowed after rejection', 409, 'KYC_RESUBMISSION_NOT_ALLOWED');
  }
};

const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore if file already removed
  }
};

const resolveAndCleanupImages = async (userId: string, imageIds: Record<string, string>) => {
  const ids = Object.values(imageIds).filter(Boolean);
  const images = await KycImageModel.find({ _id: { $in: ids }, userId });

  if (images.length !== ids.length) {
    throw new AppError('One or more uploaded images not found', 400, 'KYC_IMAGES_NOT_FOUND');
  }

  const imageMap: Record<string, { imageType: string; url: string }> = {};
  for (const img of images) {
    imageMap[img._id.toString()] = { imageType: img.imageType, url: img.url };
  }

  const documentImages: { front: string; back?: string } = { front: '' };
  const docFront = imageMap[imageIds.front];
  if (docFront) documentImages.front = docFront.url;
  if (imageIds.back) {
    const docBack = imageMap[imageIds.back];
    if (docBack) documentImages.back = docBack.url;
  }

  const livenessImages: { face_clear: string; move_left: string; move_right: string; smile: string } = {
    face_clear: imageMap[imageIds.face_clear]?.url || '',
    move_left: imageMap[imageIds.move_left]?.url || '',
    move_right: imageMap[imageIds.move_right]?.url || '',
    smile: imageMap[imageIds.smile]?.url || '',
  };

  await KycImageModel.deleteMany({ _id: { $in: ids } });

  for (const img of images) {
    if (img.url?.startsWith('/uploads/')) {
      await deleteFileIfExists(path.join(process.cwd(), img.url));
    }
  }

  return { documentImages, livenessImages };
};

export const kycService = {
  getProviderStatus: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);
    const latest = await getLatestKycDocument(userId);
    return serializeStatus(latest?.status ?? 'missing', latest, user);
  },

  getRestrictedAccess: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);
    const latest = await getLatestKycDocument(userId);
    return {
      accessGranted: latest?.status === 'approved' && user.role === 'provider',
      status: latest?.status ?? 'missing',
      reason: latest?.status === 'approved'
        ? 'KYC approved. Provider actions are enabled.'
        : 'KYC approval is required before restricted provider actions are available.',
      latestDocument: serializeDocument(latest),
    };
  },

  uploadImage: async (userId: string, imageType: string, url: string) => {
    await getUserOrThrow(userId);
    const image = await KycImageModel.create({ userId, imageType, url });
    return { imageId: image._id.toString() };
  },

  submitKyc: async (userId: string, input: KycSubmissionInput) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);
    await ensureLatestStatusAllowsSubmission(userId, 'submit');

    const { documentImages, livenessImages } = await resolveAndCleanupImages(userId, {
      front: input.documentImageIds.front,
      ...(input.documentImageIds.back ? { back: input.documentImageIds.back } : {}),
      face_clear: input.livenessImageIds.face_clear,
      move_left: input.livenessImageIds.move_left,
      move_right: input.livenessImageIds.move_right,
      smile: input.livenessImageIds.smile,
    } as Record<string, string>);

    const document = await KycDocumentModel.create({
      userId: user._id,
      userRole: user.role,
      status: 'pending',
      documentType: input.documentType,
      documentImages,
      livenessImages,
      countryCode: input.countryCode.toUpperCase(),
      notes: input.notes || undefined,
      submittedAt: new Date(),
    });

    if (user.role !== 'provider') {
      user.role = 'provider';
      await user.save();
    }

    return serializeDocument(document);
  },

  resubmitKyc: async (userId: string, input: KycSubmissionInput) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);
    await ensureLatestStatusAllowsSubmission(userId, 'resubmit');

    const { documentImages, livenessImages } = await resolveAndCleanupImages(userId, {
      front: input.documentImageIds.front,
      ...(input.documentImageIds.back ? { back: input.documentImageIds.back } : {}),
      face_clear: input.livenessImageIds.face_clear,
      move_left: input.livenessImageIds.move_left,
      move_right: input.livenessImageIds.move_right,
      smile: input.livenessImageIds.smile,
    } as Record<string, string>);

    const document = await KycDocumentModel.create({
      userId: user._id,
      userRole: user.role,
      status: 'pending',
      documentType: input.documentType,
      documentImages,
      livenessImages,
      countryCode: input.countryCode.toUpperCase(),
      notes: input.notes || undefined,
      submittedAt: new Date(),
    });

    return serializeDocument(document);
  },

  listSubmissions: async (reviewerId: string, status?: KycStatus) => {
    const reviewer = await getUserOrThrow(reviewerId);
    assertAdmin(reviewer);
    const filter = status ? { status } : {};
    const documents = await KycDocumentModel.find(filter).sort({ createdAt: -1 }).limit(100);
    return documents.map((d) => serializeDocument(d));
  },

  reviewSubmission: async (reviewerId: string, userId: string, action: KycReviewAction, reason?: string) => {
    const reviewer = await getUserOrThrow(reviewerId);
    assertAdmin(reviewer);
    const user = await getUserOrThrow(userId);
    const document = await KycDocumentModel.findOne({ userId: user._id, status: 'pending' }).sort({ createdAt: -1 });

    if (!document) {
      throw new AppError('No pending KYC submission found for this user', 404, 'KYC_SUBMISSION_NOT_FOUND');
    }

    document.status = action === 'approve' ? 'approved' : 'rejected';
    document.reviewedBy = reviewer._id;
    document.reviewedAt = new Date();
    document.rejectionReason = action === 'reject' ? reason : undefined;
    await document.save();

    if (action === 'approve' && user.role !== 'provider') {
      user.role = 'provider';
      await user.save();
    }

    return {
      document: serializeDocument(document),
      user: { id: user.id, role: user.role, fullName: user.fullName, email: user.email },
    };
  },

  assertProviderApproved: async (userId: string): Promise<void> => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);
    const latest = await getLatestKycDocument(userId);
    if (latest?.status !== 'approved' || user.role !== 'provider') {
      throw new AppError('KYC approval is required to access this action', 403, 'KYC_APPROVAL_REQUIRED', {
        status: latest?.status ?? 'missing',
      });
    }
  },

  getSubmissionDetail: async (reviewerId: string, userId: string) => {
    const reviewer = await getUserOrThrow(reviewerId);
    assertAdmin(reviewer);
    const document = await KycDocumentModel.findOne({ userId }).sort({ createdAt: -1 });
    if (!document) throw new AppError('No KYC submission found for this user', 404, 'KYC_SUBMISSION_NOT_FOUND');

    const serialized = serializeDocument(document);
    return {
      ...serialized,
      documentImages: { front: document.documentImages.front, back: document.documentImages.back || null },
      livenessImages: {
        face_clear: document.livenessImages.face_clear,
        move_left: document.livenessImages.move_left,
        move_right: document.livenessImages.move_right,
        smile: document.livenessImages.smile,
      },
    };
  },
};

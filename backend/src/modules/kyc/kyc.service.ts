import { AppError } from '../../common/errors/AppError.js';
import { buildKycStorageKey, buildSignedUploadUrl, resolveStorageProvider } from '../../common/utils/storage.js';
import UserModel, { type IUser } from '../auth/auth.model.js';
import KycDocumentModel, { type IKycDocument, type KycDocumentType, type KycStatus } from './kyc.model.js';

type KycSubmissionInput = {
  documentType: KycDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageUrl: string;
  storageProvider?: 'mock' | 's3' | 'r2';
  countryCode: string;
  notes?: string;
};

type KycUploadUrlInput = {
  documentType: KycDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageProvider?: 'mock' | 's3' | 'r2';
  countryCode: string;
};

type KycReviewAction = 'approve' | 'reject';

const allowedProviderRoles = new Set<IUser['role']>(['pending', 'provider', 'admin']);

const assertProviderEligible = (user: IUser): void => {
  if (!allowedProviderRoles.has(user.role)) {
    throw new AppError('Only provider accounts can access KYC flows', 403, 'KYC_PROVIDER_REQUIRED');
  }
};

const assertAdmin = (user: IUser): void => {
  if (user.role !== 'admin') {
    throw new AppError('Admin access required', 403, 'FORBIDDEN');
  }
};

const getUserOrThrow = async (userId: string): Promise<IUser> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
};

const getLatestKycDocument = async (userId: string): Promise<IKycDocument | null> => {
  return KycDocumentModel.findOne({ userId }).sort({ createdAt: -1 });
};

const serializeDocument = (document: IKycDocument | null) => {
  if (!document) {
    return null;
  }

  const json = document.toJSON() as Record<string, unknown>;
  return {
    id: json._id,
    userId: json.userId,
    userRole: json.userRole,
    status: json.status as KycStatus,
    documentType: json.documentType,
    storageProvider: json.storageProvider,
    storageKey: json.storageKey,
    storageUrl: json.storageUrl,
    originalFileName: json.originalFileName,
    mimeType: json.mimeType,
    fileSizeBytes: json.fileSizeBytes,
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

const serializeStatus = (status: KycStatus | 'missing', document: IKycDocument | null, user: IUser) => {
  return {
    user: {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    },
    status,
    canAccessRestrictedActions: status === 'approved' && user.role === 'provider',
    latestDocument: serializeDocument(document),
  };
};

const ensureLatestStatusAllowsSubmission = async (userId: string, mode: 'submit' | 'resubmit'): Promise<void> => {
  const latest = await getLatestKycDocument(userId);

  if (mode === 'submit') {
    if (latest?.status === 'pending') {
      throw new AppError('KYC submission is already pending review', 409, 'KYC_ALREADY_PENDING');
    }
    if (latest?.status === 'approved') {
      throw new AppError('KYC has already been approved', 409, 'KYC_ALREADY_APPROVED');
    }
  }

  if (mode === 'resubmit' && latest?.status !== 'rejected') {
    throw new AppError('KYC resubmission is only allowed after rejection', 409, 'KYC_RESUBMISSION_NOT_ALLOWED');
  }
};

const resolveStorageProviderInput = (provider?: 'mock' | 's3' | 'r2') => provider || resolveStorageProvider();

export const kycService = {
  getProviderStatus: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);

    const latest = await getLatestKycDocument(userId);
    const status = latest?.status ?? 'missing';

    return serializeStatus(status, latest, user);
  },

  getRestrictedAccess: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);

    const latest = await getLatestKycDocument(userId);
    const status = latest?.status ?? 'missing';

    return {
      accessGranted: status === 'approved' && user.role === 'provider',
      status,
      reason:
        status === 'approved'
          ? 'KYC approved. Provider actions are enabled.'
          : 'KYC approval is required before restricted provider actions are available.',
      latestDocument: serializeDocument(latest),
    };
  },

  createUploadUrl: async (userId: string, input: KycUploadUrlInput) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);

    const storageProvider = resolveStorageProviderInput(input.storageProvider);
    const storageKey = buildKycStorageKey(userId, input.fileName);
    const { uploadUrl, expiresAt } = buildSignedUploadUrl(storageKey, input.mimeType, input.fileSizeBytes, storageProvider);

    return {
      storageProvider,
      storageKey,
      uploadUrl,
      expiresAt,
      documentType: input.documentType,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      countryCode: input.countryCode.toUpperCase(),
    };
  },

  submitKyc: async (userId: string, input: KycSubmissionInput) => {
    const user = await getUserOrThrow(userId);
    assertProviderEligible(user);

    await ensureLatestStatusAllowsSubmission(userId, 'submit');

    const document = await KycDocumentModel.create({
      userId: user._id,
      userRole: user.role,
      status: 'pending',
      documentType: input.documentType,
      storageProvider: input.storageProvider || resolveStorageProvider(),
      storageKey: input.storageKey,
      storageUrl: input.storageUrl,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      countryCode: input.countryCode.toUpperCase(),
      notes: input.notes,
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

    const document = await KycDocumentModel.create({
      userId: user._id,
      userRole: user.role,
      status: 'pending',
      documentType: input.documentType,
      storageProvider: input.storageProvider || resolveStorageProvider(),
      storageKey: input.storageKey,
      storageUrl: input.storageUrl,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      countryCode: input.countryCode.toUpperCase(),
      notes: input.notes,
      submittedAt: new Date(),
    });

    return serializeDocument(document);
  },

  listSubmissions: async (reviewerId: string, status?: KycStatus) => {
    const reviewer = await getUserOrThrow(reviewerId);
    assertAdmin(reviewer);

    const filter = status ? { status } : {};
    const documents = await KycDocumentModel.find(filter).sort({ createdAt: -1 }).limit(100);
    return documents.map((document) => serializeDocument(document));
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
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
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
};

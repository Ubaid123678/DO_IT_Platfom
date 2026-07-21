import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockedFindById,
  mockedFindOne,
  mockedCreate,
  mockedBuildKycStorageKey,
  mockedBuildSignedUploadUrl,
  mockedResolveStorageProvider,
} = vi.hoisted(() => ({
  mockedFindById: vi.fn(),
  mockedFindOne: vi.fn(),
  mockedCreate: vi.fn(),
  mockedBuildKycStorageKey: vi.fn(),
  mockedBuildSignedUploadUrl: vi.fn(),
  mockedResolveStorageProvider: vi.fn(),
}));

vi.mock('../auth/auth.model.js', () => {
  return {
    default: {
      findById: mockedFindById,
    },
  };
});

vi.mock('./kyc.model.js', () => {
  return {
    default: {
      findOne: mockedFindOne,
      create: mockedCreate,
    },
  };
});

vi.mock('../../common/utils/storage.js', () => {
  return {
    buildKycStorageKey: mockedBuildKycStorageKey,
    buildSignedUploadUrl: mockedBuildSignedUploadUrl,
    resolveStorageProvider: mockedResolveStorageProvider,
  };
});

import { kycService } from './kyc.service.js';

const providerUser = {
  _id: 'user_provider_1',
  id: 'user_provider_1',
  role: 'provider',
  fullName: 'Provider User',
  email: 'provider@example.com',
  phone: '+923001111111',
  countryCode: 'PK',
  save: vi.fn(),
};

const pendingUser = {
  _id: 'user_pending_1',
  id: 'user_pending_1',
  role: 'pending',
  fullName: 'Pending User',
  email: 'pending@example.com',
  phone: '+923001111112',
  countryCode: 'PK',
  save: vi.fn(),
};

const adminUser = {
  _id: 'user_admin_1',
  id: 'user_admin_1',
  role: 'admin',
  fullName: 'Admin User',
  email: 'admin@example.com',
  phone: '+923001111113',
  countryCode: 'PK',
  save: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('kycService', () => {
  it('generates upload urls for provider users', async () => {
    mockedFindById.mockResolvedValue(providerUser);
    mockedResolveStorageProvider.mockReturnValue('mock');
    mockedBuildKycStorageKey.mockReturnValue('kyc/user_provider_1/123-id-card.png');
    mockedBuildSignedUploadUrl.mockReturnValue({
      uploadUrl: 'https://upload.test/kyc/user_provider_1/123-id-card.png',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      storageProvider: 'mock',
    });

    const result = await kycService.createUploadUrl('user_provider_1', {
      documentType: 'id_card',
      fileName: 'id-card.png',
      mimeType: 'image/png',
      fileSizeBytes: 1024,
      countryCode: 'PK',
    });

    expect(result.storageKey).toBe('kyc/user_provider_1/123-id-card.png');
    expect(result.uploadUrl).toContain('upload.test');
    expect(mockedBuildSignedUploadUrl).toHaveBeenCalledWith(
      'kyc/user_provider_1/123-id-card.png',
      'image/png',
      1024,
      'mock',
    );
  });

  it('stores pending kyc submissions and promotes pending accounts to provider', async () => {
    mockedFindById.mockResolvedValue(pendingUser);
    mockedFindOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue(null),
    });

    const createdDocument = {
      toJSON: () => ({
        _id: 'kyc_1',
        userId: 'user_pending_1',
        userRole: 'provider',
        status: 'pending',
        documentType: 'passport',
        storageProvider: 'mock',
        storageKey: 'kyc/user_pending_1/submit-passport.png',
        storageUrl: 'https://upload.test/kyc/user_pending_1/submit-passport.png',
        originalFileName: 'passport.png',
        mimeType: 'image/png',
        fileSizeBytes: 2048,
        countryCode: 'PK',
        submittedAt: new Date('2026-01-02T00:00:00.000Z'),
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        notes: null,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    };

    mockedCreate.mockResolvedValue(createdDocument);

    const result = await kycService.submitKyc('user_pending_1', {
      documentType: 'passport',
      fileName: 'passport.png',
      mimeType: 'image/png',
      fileSizeBytes: 2048,
      storageKey: 'kyc/user_pending_1/submit-passport.png',
      storageUrl: 'https://upload.test/kyc/user_pending_1/submit-passport.png',
      storageProvider: 'mock',
      countryCode: 'PK',
    });

    expect(result.status).toBe('pending');
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(pendingUser.save).toHaveBeenCalledTimes(1);
    expect(pendingUser.role).toBe('provider');
  });

  it('approves pending submissions and updates provider access', async () => {
    mockedFindById.mockImplementation(async (id: string) => {
      if (id === 'user_admin_1') {
        return adminUser;
      }

      if (id === 'user_pending_1') {
        return pendingUser;
      }

      return null;
    });

    const pendingDocument = {
      status: 'pending',
      reviewedBy: undefined,
      reviewedAt: undefined,
      rejectionReason: undefined,
      save: vi.fn(),
      toJSON: () => ({
        _id: 'kyc_2',
        userId: 'user_pending_1',
        userRole: 'pending',
        status: 'approved',
        documentType: 'id_card',
        storageProvider: 'mock',
        storageKey: 'kyc/user_pending_1/approved-id-card.png',
        storageUrl: 'https://upload.test/kyc/user_pending_1/approved-id-card.png',
        originalFileName: 'id-card.png',
        mimeType: 'image/png',
        fileSizeBytes: 1024,
        countryCode: 'PK',
        submittedAt: new Date('2026-01-03T00:00:00.000Z'),
        reviewedBy: 'user_admin_1',
        reviewedAt: new Date('2026-01-03T00:00:00.000Z'),
        rejectionReason: null,
        notes: null,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    };

    mockedFindOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue(pendingDocument),
    });

    const result = await kycService.reviewSubmission('user_admin_1', 'user_pending_1', 'approve');

    expect(result.document.status).toBe('approved');
    expect(pendingDocument.save).toHaveBeenCalledTimes(1);
    expect(adminUser.role).toBe('admin');
    expect(pendingUser.role).toBe('provider');
  });
});

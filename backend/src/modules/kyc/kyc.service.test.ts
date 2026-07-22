import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockedFindById,
  mockedFindOne,
  mockedCreate,
  mockedImageFind,
  mockedImageDeleteMany,
} = vi.hoisted(() => ({
  mockedFindById: vi.fn(),
  mockedFindOne: vi.fn(),
  mockedCreate: vi.fn(),
  mockedImageFind: vi.fn(),
  mockedImageDeleteMany: vi.fn(),
}));

vi.mock('../auth/auth.model.js', () => ({ default: { findById: mockedFindById } }));

vi.mock('./kyc.model.js', () => ({ default: { findOne: mockedFindOne, create: mockedCreate } }));

vi.mock('./kyc-image.model.js', () => ({
  default: { find: mockedImageFind, deleteMany: mockedImageDeleteMany },
}));

import { kycService } from './kyc.service.js';

const providerUser = {
  _id: 'user_provider_1',
  id: 'user_provider_1',
  role: 'provider',
  fullName: 'Provider User',
  email: 'provider@example.com',
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
  save: vi.fn(),
};

beforeEach(() => { vi.clearAllMocks(); });

describe('kycService', () => {
  it('stores pending kyc submissions with images and promotes pending accounts to provider', async () => {
    mockedFindById.mockResolvedValue(pendingUser);
    mockedFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(null) });

    const mockImages = [
      { _id: 'img_front', imageType: 'document_front', data: 'data:image/jpeg;base64,/9j/front' },
      { _id: 'img_back', imageType: 'document_back', data: 'data:image/jpeg;base64,/9j/back' },
      { _id: 'img_face', imageType: 'face_clear', data: 'data:image/jpeg;base64,/9j/face' },
      { _id: 'img_left', imageType: 'move_left', data: 'data:image/jpeg;base64,/9j/left' },
      { _id: 'img_right', imageType: 'move_right', data: 'data:image/jpeg;base64,/9j/right' },
      { _id: 'img_smile', imageType: 'smile', data: 'data:image/jpeg;base64,/9j/smile' },
    ];
    mockedImageFind.mockResolvedValue(mockImages);
    mockedImageDeleteMany.mockResolvedValue({ deletedCount: 6 });

    const createdDocument = {
      toJSON: () => ({
        _id: 'kyc_1',
        userId: 'user_pending_1',
        userRole: 'provider',
        status: 'pending',
        documentType: 'passport',
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
      documentImageIds: { front: 'img_front', back: 'img_back' },
      livenessImageIds: { face_clear: 'img_face', move_left: 'img_left', move_right: 'img_right', smile: 'img_smile' },
      countryCode: 'PK',
    });

    expect(result.status).toBe('pending');
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(pendingUser.save).toHaveBeenCalledTimes(1);
    expect(pendingUser.role).toBe('provider');
  });

  it('approves pending submissions and updates provider access', async () => {
    mockedFindById.mockImplementation(async (id: string) => {
      if (id === 'user_admin_1') return adminUser;
      if (id === 'user_pending_1') return pendingUser;
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
        documentType: 'passport',
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

    mockedFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(pendingDocument) });

    const result = await kycService.reviewSubmission('user_admin_1', 'user_pending_1', 'approve');

    expect(result.document.status).toBe('approved');
    expect(pendingDocument.save).toHaveBeenCalledTimes(1);
    expect(pendingUser.role).toBe('provider');
  });
});

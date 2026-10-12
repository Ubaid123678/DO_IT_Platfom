import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateAccessToken } from '../auth/auth.utils.js';

const mockedKycService = {
  getProviderStatus: vi.fn(),
  getRestrictedAccess: vi.fn(),
  submitKyc: vi.fn(),
  resubmitKyc: vi.fn(),
  listSubmissions: vi.fn(),
  reviewSubmission: vi.fn(),
  assertProviderApproved: vi.fn(),
  getSubmissionDetail: vi.fn(),
};

vi.mock('./kyc.service.js', () => ({ kycService: mockedKycService }));

let app: import('express').Express;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';

  const appModule = await import('../../index.js');
  app = appModule.default;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KYC API HTTP Integration', () => {
  it('returns provider status payload for authenticated providers', async () => {
    const token = generateAccessToken({
      sub: 'provider_1',
      role: 'provider',
      email: 'provider@example.com',
    });

    mockedKycService.getProviderStatus.mockResolvedValue({
      user: {
        id: 'provider_1',
        role: 'provider',
        fullName: 'Provider One',
        email: 'provider@example.com',
      },
      status: 'pending',
      canAccessRestrictedActions: false,
      latestDocument: null,
    });

    const response = await request(app)
      .get('/api/v1/kyc/provider/status')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('pending');
    expect(mockedKycService.getProviderStatus).toHaveBeenCalledWith(
      'provider_1',
    );
  });

  it('rejects kyc submit with missing required fields', async () => {
    const token = generateAccessToken({
      sub: 'provider_2',
      role: 'provider',
      email: 'provider2@example.com',
    });

    const response = await request(app)
      .post('/api/v1/kyc/provider/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({ documentType: 'passport' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockedKycService.submitKyc).not.toHaveBeenCalled();
  });

  it('allows admins to approve provider submissions', async () => {
    const token = generateAccessToken({
      sub: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
    });

    mockedKycService.reviewSubmission.mockResolvedValue({
      document: { id: 'kyc_1', status: 'approved' },
      user: {
        id: 'provider_1',
        role: 'provider',
        fullName: 'Provider One',
        email: 'provider@example.com',
      },
    });

    const response = await request(app)
      .patch('/api/v1/kyc/admin/provider_1/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.document.status).toBe('approved');
    expect(mockedKycService.reviewSubmission).toHaveBeenCalledWith(
      'admin_1',
      'provider_1',
      'approve',
      undefined,
    );
  });

  it('requires admin authorization and returns paginated KYC submission rows', async () => {
    const clientToken = generateAccessToken({
      sub: 'client_1',
      role: 'client',
      email: 'client@example.com',
    });
    const forbidden = await request(app)
      .get('/api/v1/kyc/admin/submissions?page=2&limit=10')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(forbidden.status).toBe(403);
    expect(mockedKycService.listSubmissions).not.toHaveBeenCalled();

    const token = generateAccessToken({
      sub: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
    });
    mockedKycService.listSubmissions.mockResolvedValue({
      submissions: [
        {
          id: 'kyc_1',
          userId: 'provider_1',
          status: 'pending',
          submittedAt: '2026-10-10T00:00:00.000Z',
          user: { fullName: 'Provider One', email: 'provider@example.com' },
        },
      ],
      pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
    });

    const response = await request(app)
      .get(
        '/api/v1/kyc/admin/submissions?page=2&limit=10&search=Pro&status=pending&sort_order=asc',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 11,
      totalPages: 2,
    });
    expect(response.body.data.submissions[0].user).toEqual({
      fullName: 'Provider One',
      email: 'provider@example.com',
    });
    expect(response.body.data.submissions[0]).not.toHaveProperty(
      'documentImages',
    );
    expect(response.body.data.submissions[0]).not.toHaveProperty(
      'livenessImages',
    );
    expect(mockedKycService.listSubmissions).toHaveBeenCalledWith('admin_1', {
      page: 2,
      limit: 10,
      search: 'Pro',
      status: 'pending',
      sort_order: 'asc',
    });
  });

  it('keeps data URI and uploads URLs available from the KYC detail endpoint', async () => {
    const token = generateAccessToken({
      sub: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
    });
    mockedKycService.getSubmissionDetail.mockResolvedValue({
      id: 'kyc_1',
      documentImages: {
        front: 'data:image/jpeg;base64,ZmFrZQ==',
        back: '/uploads/kyc/back.jpg',
      },
      livenessImages: {
        face_clear: '/uploads/kyc/face.jpg',
        move_left: '/uploads/kyc/left.jpg',
        move_right: '/uploads/kyc/right.jpg',
        smile: '/uploads/kyc/smile.jpg',
      },
    });

    const response = await request(app)
      .get('/api/v1/kyc/admin/submissions/provider_1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.documentImages).toEqual({
      front: 'data:image/jpeg;base64,ZmFrZQ==',
      back: '/uploads/kyc/back.jpg',
    });
    expect(response.body.data.livenessImages.face_clear).toBe(
      '/uploads/kyc/face.jpg',
    );
  });

  it('rejects invalid KYC list query values', async () => {
    const token = generateAccessToken({
      sub: 'admin_1',
      role: 'admin',
      email: 'admin@example.com',
    });

    const response = await request(app)
      .get('/api/v1/kyc/admin/submissions?search=x&limit=101')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(mockedKycService.listSubmissions).not.toHaveBeenCalled();
  });
});

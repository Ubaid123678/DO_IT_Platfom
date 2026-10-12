import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../common/errors/AppError.js';

const mockedVerificationService = vi.hoisted(() => ({
  getAdminProviderProfile: vi.fn(),
}));

vi.mock('./verification.service.js', () => ({
  verificationService: mockedVerificationService,
}));

vi.mock('./verification-auto.service.js', () => ({
  verificationAutoService: {},
}));

let app: import('express').Express;
let generateAccessToken: typeof import('../auth/auth.utils.js').generateAccessToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'provider-profile-test-secret';
  process.env.JWT_REFRESH_SECRET = 'provider-profile-refresh-secret';

  const authUtils = await import('../auth/auth.utils.js');
  generateAccessToken = authUtils.generateAccessToken;
  app = (await import('../../index.js')).default;
});

beforeEach(() => {
  vi.clearAllMocks();
});

const tokenFor = (role: 'admin' | 'client') =>
  generateAccessToken({
    sub: `${role}-user`,
    role,
    email: `${role}@example.com`,
  });

describe('Admin provider profile API', () => {
  it('requires an admin and returns the requested profile shape', async () => {
    const clientResponse = await request(app)
      .get('/api/v1/providers/admin/profiles/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${tokenFor('client')}`);
    expect(clientResponse.status).toBe(403);
    expect(
      mockedVerificationService.getAdminProviderProfile,
    ).not.toHaveBeenCalled();

    mockedVerificationService.getAdminProviderProfile.mockResolvedValue({
      user: {
        id: '507f1f77bcf86cd799439011',
        fullName: 'Provider One',
        email: 'provider@example.com',
        phone: '+10000000000',
        role: 'provider',
        countryCode: 'US',
        emailVerified: true,
        phoneVerified: true,
        overall_status: 'verified',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      categories: [
        { id: 'category-1', name: 'Cleaning', job_type: 'physical' },
      ],
      provider_profile: { headline: 'Experienced cleaner' },
      track: 'physical',
      track_data: { physical: { years_experience: 5 } },
      completeness: 60,
      missing_fields: ['Profile photo'],
    });

    const response = await request(app)
      .get('/api/v1/providers/admin/profiles/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      user: {
        id: '507f1f77bcf86cd799439011',
        fullName: 'Provider One',
        email: 'provider@example.com',
        phone: '+10000000000',
        role: 'provider',
        countryCode: 'US',
        emailVerified: true,
        phoneVerified: true,
        overall_status: 'verified',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      categories: [
        { id: 'category-1', name: 'Cleaning', job_type: 'physical' },
      ],
      provider_profile: { headline: 'Experienced cleaner' },
      track: 'physical',
      track_data: { physical: { years_experience: 5 } },
      completeness: 60,
      missing_fields: ['Profile photo'],
    });
    expect(
      mockedVerificationService.getAdminProviderProfile,
    ).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('returns 404 for provider IDs that do not identify providers', async () => {
    mockedVerificationService.getAdminProviderProfile.mockRejectedValue(
      new AppError('Provider not found', 404, 'PROVIDER_NOT_FOUND'),
    );

    const response = await request(app)
      .get('/api/v1/providers/admin/profiles/507f1f77bcf86cd799439099')
      .set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PROVIDER_NOT_FOUND');
  });

  it('returns 400 for malformed provider IDs', async () => {
    mockedVerificationService.getAdminProviderProfile.mockRejectedValue(
      new AppError('Invalid provider ID', 400, 'INVALID_PROVIDER_ID'),
    );

    const response = await request(app)
      .get('/api/v1/providers/admin/profiles/invalid')
      .set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(response.status).toBe(400);
  });
});

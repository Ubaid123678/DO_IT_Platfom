import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../common/errors/AppError.js';

const mockedAdminService = vi.hoisted(() => ({
  getDashboardStats: vi.fn(),
  listUsers: vi.fn(),
  getUserDetail: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('./admin.service.js', () => ({ adminService: mockedAdminService }));

let app: import('express').Express;
let generateAccessToken: typeof import('../auth/auth.utils.js').generateAccessToken;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'admin-test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'admin-test-refresh-secret';

  const authUtils = await import('../auth/auth.utils.js');
  generateAccessToken = authUtils.generateAccessToken;
  app = (await import('../../index.js')).default;
});

beforeEach(() => {
  vi.clearAllMocks();
});

const tokenFor = (
  role: 'admin' | 'client',
  userId = randomUUID().replaceAll('-', '').slice(0, 24),
): string =>
  generateAccessToken({ sub: userId, role, email: `${role}@example.com` });

describe('Admin users API', () => {
  it('rejects unauthenticated and non-admin requests', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/users');
    const clientToken = tokenFor('client');
    const forbidden = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(unauthenticated.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(mockedAdminService.listUsers).not.toHaveBeenCalled();
  });

  describe('Admin dashboard stats API', () => {
    it('requires an admin and returns the dashboard response shape', async () => {
      const clientResponse = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${tokenFor('client')}`);

      expect(clientResponse.status).toBe(403);
      expect(mockedAdminService.getDashboardStats).not.toHaveBeenCalled();

      mockedAdminService.getDashboardStats.mockResolvedValue({
        users: { total: 50, clients: 32, providers: 15, newLast7Days: 5 },
        kyc: { pending: 3, approved: 20, rejected: 2 },
        verification: {
          pending_review: 4,
          slaOverdue: 1,
          approvedToday: 2,
          rejectedToday: 1,
        },
        recentActivity: [
          {
            admin: { id: 'admin-1', fullName: 'Admin User' },
            action: 'approved',
            target: {
              id: 'provider-1',
              fullName: 'Provider User',
              email: 'provider@example.com',
            },
            created_at: '2026-10-11T00:00:00.000Z',
          },
        ],
      });

      const adminResponse = await request(app)
        .get('/api/v1/admin/dashboard/stats')
        .set('Authorization', `Bearer ${tokenFor('admin')}`);

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.data).toMatchObject({
        users: { total: 50, clients: 32, providers: 15, newLast7Days: 5 },
        kyc: { pending: 3, approved: 20, rejected: 2 },
        verification: {
          pending_review: 4,
          slaOverdue: 1,
          approvedToday: 2,
          rejectedToday: 1,
        },
      });
      expect(adminResponse.body.data.recentActivity).toHaveLength(1);
    });
  });

  it('lists users with defaults and does not expose sensitive properties', async () => {
    mockedAdminService.listUsers.mockResolvedValue({
      users: [
        {
          id: '507f1f77bcf86cd799439011',
          fullName: 'Example User',
          email: 'user@example.com',
          phone: '+10000000000',
          role: 'client',
          countryCode: 'US',
          emailVerified: true,
          phoneVerified: false,
          overall_status: 'incomplete',
          kyc_status: 'missing',
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(response.status).toBe(200);
    expect(response.body.data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(response.body.data.users[0]).not.toHaveProperty('passwordHash');
    expect(response.body.data.users[0]).not.toHaveProperty('accessToken');
    expect(mockedAdminService.listUsers).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      sort_by: 'createdAt',
      sort_order: 'desc',
    });
  });

  it('passes combined filters, pagination, and sort through to the service', async () => {
    mockedAdminService.listUsers.mockResolvedValue({
      users: [],
      pagination: { page: 2, limit: 10, total: 21, totalPages: 3 },
    });

    const response = await request(app)
      .get(
        '/api/v1/admin/users?page=2&limit=10&search=Jo&role=provider&email_verified=true&phone_verified=false&kyc_status=pending&overall_status=partially_verified&track=digital&sort_by=email&sort_order=asc',
      )
      .set('Authorization', `Bearer ${tokenFor('admin')}`);

    expect(response.status).toBe(200);
    expect(mockedAdminService.listUsers).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'Jo',
      role: 'provider',
      email_verified: true,
      phone_verified: false,
      kyc_status: 'pending',
      overall_status: 'partially_verified',
      track: 'digital',
      sort_by: 'email',
      sort_order: 'asc',
    });
  });

  it('validates search length and caps list limits at 100', async () => {
    const token = tokenFor('admin');
    const tooShort = await request(app)
      .get('/api/v1/admin/users?search=j')
      .set('Authorization', `Bearer ${token}`);
    const overLimit = await request(app)
      .get('/api/v1/admin/users?limit=101')
      .set('Authorization', `Bearer ${token}`);

    expect(tooShort.status).toBe(400);
    expect(overLimit.status).toBe(400);
    expect(mockedAdminService.listUsers).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed IDs and 404 for unknown users', async () => {
    const token = tokenFor('admin');
    const invalidId = await request(app)
      .get('/api/v1/admin/users/not-an-object-id')
      .set('Authorization', `Bearer ${token}`);
    mockedAdminService.getUserDetail.mockRejectedValue(
      new AppError('User not found', 404, 'USER_NOT_FOUND'),
    );
    const unknownUser = await request(app)
      .get('/api/v1/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);

    expect(invalidId.status).toBe(400);
    expect(unknownUser.status).toBe(404);
    expect(mockedAdminService.getUserDetail).toHaveBeenCalledTimes(1);
  });

  it('accepts an allowed role change and passes the acting admin ID', async () => {
    const adminId = '507f1f77bcf86cd799439012';
    mockedAdminService.updateUser.mockResolvedValue({
      id: '507f1f77bcf86cd799439011',
      role: 'provider',
      isActive: true,
      deletedAt: null,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const response = await request(app)
      .patch('/api/v1/admin/users/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${tokenFor('admin', adminId)}`)
      .send({ role: 'provider', reason: 'Verified provider onboarding' });

    expect(response.status).toBe(200);
    expect(mockedAdminService.updateUser).toHaveBeenCalledWith(
      adminId,
      '507f1f77bcf86cd799439011',
      { role: 'provider', reason: 'Verified provider onboarding' },
    );
  });
});

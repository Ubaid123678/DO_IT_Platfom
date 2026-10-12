import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../common/errors/AppError.js';

let generateAccessToken: typeof import('./auth.utils.js').generateAccessToken;

const mockedAuthService = {
  register: vi.fn(),
  verifyEmail: vi.fn(),
  verifyPhone: vi.fn(),
  login: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  me: vi.fn(),
  updateMe: vi.fn(),
};

vi.mock('./auth.service.js', () => {
  return {
    authService: mockedAuthService,
  };
});

let app: import('express').Express;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.OTP_DEBUG_MODE = 'true';
  process.env.WEB_ORIGIN = 'https://admin.example.test';

  const authUtils = await import('./auth.utils.js');
  generateAccessToken = authUtils.generateAccessToken;
  const appModule = await import('../../index.js');
  app = appModule.default;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Auth API HTTP Integration', () => {
  it('registers users with optional debug OTP payload', async () => {
    mockedAuthService.register.mockResolvedValue({
      user: {
        id: 'user_1',
        fullName: 'Client User',
        email: 'client@example.com',
        phone: '+923001111111',
        role: 'client',
        countryCode: 'PK',
        emailVerified: false,
        phoneVerified: false,
      },
      emailOtp: '123456',
      phoneOtp: '654321',
    });

    const response = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Client User',
      email: 'client@example.com',
      phone: '+923001111111',
      password: 'StrongPass123!',
      role: 'client',
      countryCode: 'PK',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('client');
    if (response.body.data.debugOtp) {
      expect(response.body.data.debugOtp.emailOtp).toBe('123456');
      expect(response.body.data.debugOtp.phoneOtp).toBe('654321');
    }
    expect(mockedAuthService.register).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid register payloads before service call', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'bad@example.com',
      password: 'weak',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockedAuthService.register).not.toHaveBeenCalled();
  });

  it('returns account locked error from login', async () => {
    mockedAuthService.login.mockRejectedValue(
      new AppError('Account is temporarily locked. Please try again later.', 423, 'ACCOUNT_LOCKED'),
    );

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'locked@example.com',
      password: 'WrongPass999!',
    });

    expect(response.status).toBe(423);
    expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('returns a clear disabled-account error from login', async () => {
    mockedAuthService.login.mockRejectedValue(
      new AppError('This account is deactivated. Contact support for assistance.', 403, 'ACCOUNT_DISABLED'),
    );

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'disabled@example.com',
      password: 'StrongPass123!',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCOUNT_DISABLED');
    expect(response.body.error.message).toContain('deactivated');
  });

  for (const role of ['admin', 'client'] as const) {
    it(`logs in ${role} users and returns their role and access token`, async () => {
      const email = `${role}@example.com`;
      const accessToken = generateAccessToken({ sub: `${role}_user`, role, email });
      mockedAuthService.login.mockResolvedValue({
        user: {
          id: `${role}_user`,
          fullName: `${role} user`,
          email,
          phone: '+923001111111',
          role,
          countryCode: 'PK',
          emailVerified: true,
          phoneVerified: true,
        },
        accessToken,
        refreshToken: 'refresh-token',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email,
        password: 'StrongPass123!',
      });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBe(accessToken);
      expect(response.body.data.user.role).toBe(role);
      expect(response.body.data.refreshToken).toBe('refresh-token');
      expect(response.headers['ratelimit-limit']).toBe('10');
    });
  }

  for (const route of [
    '/api/v1/admin',
    '/api/v1/auth/admin/stats',
    '/api/v1/kyc/admin/submissions',
    '/api/v1/providers/admin/records',
  ]) {
    it(`rejects a client token on ${route}`, async () => {
      const token = generateAccessToken({
        sub: 'client_1',
        role: 'client',
        email: 'client@example.com',
      });

      const response = await request(app).get(route).set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden',
        },
      });
    });
  }

  it('requires admin authorization on every admin endpoint', async () => {
    const readRoutes = [
      '/api/v1/admin',
      '/api/v1/admin/dashboard/stats',
      '/api/v1/admin/users',
      '/api/v1/admin/users/507f1f77bcf86cd799439011',
      '/api/v1/auth/admin/stats',
      '/api/v1/kyc/admin/submissions',
      '/api/v1/kyc/admin/submissions/507f1f77bcf86cd799439011',
      '/api/v1/providers/admin/profiles/507f1f77bcf86cd799439011',
      '/api/v1/providers/admin/records',
      '/api/v1/providers/admin/records/507f1f77bcf86cd799439011',
      '/api/v1/providers/admin/records/507f1f77bcf86cd799439011/audit-trail',
    ];
    const clientToken = generateAccessToken({
      sub: 'client_1',
      role: 'client',
      email: 'client@example.com',
    });

    for (const route of readRoutes) {
      const unauthenticatedResponse = await request(app).get(route);
      const forbiddenResponse = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(unauthenticatedResponse.status, `Unauthenticated ${route}`).toBe(401);
      expect(forbiddenResponse.status, `Client access ${route}`).toBe(403);
      expect(forbiddenResponse.body.error.code).toBe('FORBIDDEN');
    }

    const writeRoutes = [
      { method: 'patch', path: '/api/v1/admin/users/507f1f77bcf86cd799439011' },
      { method: 'delete', path: '/api/v1/admin/users/507f1f77bcf86cd799439011' },
      { method: 'patch', path: '/api/v1/kyc/admin/507f1f77bcf86cd799439011/approve' },
      { method: 'patch', path: '/api/v1/kyc/admin/507f1f77bcf86cd799439011/reject' },
      {
        method: 'post',
        path: '/api/v1/providers/admin/records/507f1f77bcf86cd799439011/review',
      },
    ] as const;

    for (const route of writeRoutes) {
      for (const token of [undefined, clientToken]) {
        const call =
          route.method === 'delete'
            ? request(app).delete(route.path)
            : route.method === 'patch'
              ? request(app).patch(route.path).send({})
              : request(app).post(route.path).send({});
        if (token) call.set('Authorization', `Bearer ${token}`);

        const response = await call;
        expect(response.status, `${route.method.toUpperCase()} ${route.path}`).toBe(
          token ? 403 : 401,
        );
      }
    }
  });

  it('requires an authenticated admin to read KYC uploads', async () => {
    const fileName = `auth-test-${randomUUID()}.txt`;
    const filePath = path.resolve(process.cwd(), 'uploads', 'kyc', fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, 'private-kyc-file', 'utf8');

    try {
      const unauthenticatedResponse = await request(app).get(`/uploads/kyc/${fileName}`);
      expect(unauthenticatedResponse.status).toBe(401);

      const clientToken = generateAccessToken({
        sub: 'client_1',
        role: 'client',
        email: 'client@example.com',
      });
      const forbiddenResponse = await request(app)
        .get(`/uploads/kyc/${fileName}`)
        .set('Authorization', `Bearer ${clientToken}`);
      expect(forbiddenResponse.status).toBe(403);

      const publicAliasResponse = await request(app).get(`/uploads/%6Byc/${fileName}`);
      expect(publicAliasResponse.status).not.toBe(200);
      const traversalResponse = await request(app).get(`/uploads/%2e%2e/uploads/kyc/${fileName}`);
      expect(traversalResponse.status).not.toBe(200);

      const adminToken = generateAccessToken({
        sub: 'admin_1',
        role: 'admin',
        email: 'admin@example.com',
      });
      const adminResponse = await request(app)
        .get(`/uploads/kyc/${fileName}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminResponse.status).toBe(200);
      expect(adminResponse.text).toBe('private-kyc-file');
      expect(adminResponse.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it('continues serving non-KYC upload folders publicly', async () => {
    const fileName = `auth-test-${randomUUID()}.txt`;
    const filePath = path.resolve(process.cwd(), 'uploads', 'avatar', fileName);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, 'public-avatar-file', 'utf8');

    try {
      const response = await request(app).get(`/uploads/avatar/${fileName}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe('public-avatar-file');
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it('allows the configured web origin to send credentialed Authorization requests', async () => {
    const response = await request(app)
      .options('/api/v1/admin/users')
      .set('Origin', 'https://admin.example.test')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://admin.example.test');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('allows the alternate Next.js development port for credentialed requests', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
  });

  it('does not allow unconfigured non-local web origins', async () => {
    const response = await request(app)
      .options('/api/v1/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('supports me and update me endpoints with bearer token', async () => {
    const accessToken = generateAccessToken({
      sub: 'user_2',
      role: 'client',
      email: 'me@example.com',
    });

    mockedAuthService.me.mockResolvedValue({
      id: 'user_2',
      fullName: 'Me User',
      email: 'me@example.com',
      phone: '+923009999999',
      role: 'client',
      countryCode: 'PK',
      emailVerified: true,
      phoneVerified: true,
    });

    mockedAuthService.updateMe.mockResolvedValue({
      id: 'user_2',
      fullName: 'Updated Me User',
      email: 'me@example.com',
      phone: '+923009999999',
      role: 'client',
      countryCode: 'PK',
      emailVerified: true,
      phoneVerified: true,
    });

    const meResponse = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

    const updateResponse = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName: 'Updated Me User' });

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.email).toBe('me@example.com');
    expect(mockedAuthService.me).toHaveBeenCalledWith('user_2');

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.user.fullName).toBe('Updated Me User');
    expect(mockedAuthService.updateMe).toHaveBeenCalledWith('user_2', { fullName: 'Updated Me User' });
  });

  it('supports forgot and reset password endpoint contract', async () => {
    mockedAuthService.forgotPassword.mockResolvedValue({
      resetToken: 'debug-reset-token',
    });
    mockedAuthService.resetPassword.mockResolvedValue(undefined);

    const forgotResponse = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'reset@example.com',
    });

    const resetResponse = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'debug-reset-token',
      newPassword: 'NewStrongPass123!',
    });

    expect(forgotResponse.status).toBe(200);
    if (forgotResponse.body.data.debugResetToken) {
      expect(forgotResponse.body.data.debugResetToken).toBe('debug-reset-token');
    }

    expect(resetResponse.status).toBe(200);
    expect(mockedAuthService.resetPassword).toHaveBeenCalledWith('debug-reset-token', 'NewStrongPass123!');
  });

  it('limits repeated login attempts from one client IP', async () => {
    const responses = [];
    for (let attempt = 0; attempt < 7; attempt += 1) {
      responses.push(
        await request(app).post('/api/v1/auth/login').send({
          email: 'rate-limit@example.com',
          password: 'StrongPass123!',
        }),
      );
    }

    expect(responses.slice(0, 6).every((response) => response.status === 200)).toBe(true);
    expect(responses[6].status).toBe(429);
    expect(responses[6].body.error.code).toBe('LOGIN_RATE_LIMITED');
  });
});

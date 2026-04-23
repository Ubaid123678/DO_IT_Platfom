import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../common/errors/AppError.js';
import { generateAccessToken } from './auth.utils.js';

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
});

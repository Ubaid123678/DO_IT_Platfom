import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedFindOne, mockedCompare } = vi.hoisted(() => ({
  mockedFindOne: vi.fn(),
  mockedCompare: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: { compare: mockedCompare, hash: vi.fn() },
}));

vi.mock('./auth.model.js', () => ({
  default: { findOne: mockedFindOne },
}));

vi.mock('./auth.utils.js', () => ({
  generateAccessToken: vi.fn(),
  generateOtp: vi.fn(),
  generatePasswordResetToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock('./admin-seed.js', () => ({ seedAdminIfMissing: vi.fn() }));
vi.mock('./password.js', () => ({ hashPassword: vi.fn() }));
vi.mock('../../common/utils/audit.js', () => ({ logAuthAudit: vi.fn() }));
vi.mock('../../common/utils/otpDelivery.js', () => ({
  sendEmailOtp: vi.fn(),
  sendPhoneOtp: vi.fn(),
}));

import { authService } from './auth.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService login', () => {
  it('blocks login for a deactivated user before password verification', async () => {
    mockedFindOne.mockResolvedValue({
      id: 'inactive-user',
      email: 'inactive@example.com',
      isActive: false,
      deletedAt: undefined,
    });

    await expect(
      authService.login({
        email: 'inactive@example.com',
        password: 'ValidPass123!',
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'ACCOUNT_DISABLED',
      message: expect.stringContaining('deactivated'),
    });
    expect(mockedCompare).not.toHaveBeenCalled();
  });
});

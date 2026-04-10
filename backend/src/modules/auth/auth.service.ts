import bcrypt from 'bcrypt';

import { AppError } from '../../common/errors/AppError.js';
import { logAuthAudit } from '../../common/utils/audit.js';
import UserModel, { type IUser, type UserRole } from './auth.model.js';
import {
  generateAccessToken,
  generateOtp,
  generatePasswordResetToken,
  generateRefreshToken,
  verifyRefreshToken,
} from './auth.utils.js';

type RegisterInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  countryCode: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UpdateProfileInput = {
  fullName?: string;
};

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

const buildAuthTokens = (user: IUser): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    sub: user.id,
    tokenVersion: user.tokenVersion,
    type: 'refresh',
  });

  return { accessToken, refreshToken };
};

export const authService = {
  register: async (input: RegisterInput): Promise<{ user: IUser; emailOtp: string; phoneOtp: string }> => {
    const existingUser = await UserModel.findOne({
      $or: [{ email: input.email.toLowerCase() }, { phone: input.phone }],
    });

    if (existingUser) {
      throw new AppError('Email or phone already registered', 409, 'USER_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    const user = await UserModel.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phone: input.phone,
      passwordHash,
      role: input.role,
      countryCode: input.countryCode,
      emailOtp: { code: emailOtp, expiresAt, attempts: 0 },
      phoneOtp: { code: phoneOtp, expiresAt, attempts: 0 },
    });

    logAuthAudit({
      event: 'auth.register.success',
      userId: user.id,
      email: user.email,
      metadata: { role: user.role },
    });

    return { user, emailOtp, phoneOtp };
  },

  verifyEmail: async (email: string, otp: string): Promise<void> => {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.emailOtp) {
      throw new AppError('No active email OTP found', 400, 'OTP_NOT_FOUND');
    }

    if (user.emailOtp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError('Email OTP attempts exceeded', 429, 'OTP_ATTEMPTS_EXCEEDED');
    }

    if (user.emailOtp.expiresAt.getTime() < Date.now()) {
      throw new AppError('Email OTP expired', 400, 'OTP_EXPIRED');
    }

    if (user.emailOtp.code !== otp) {
      user.emailOtp.attempts += 1;
      await user.save();
      throw new AppError('Invalid email OTP', 400, 'OTP_INVALID');
    }

    user.emailVerified = true;
    user.emailOtp = undefined;
    await user.save();
  },

  verifyPhone: async (phone: string, otp: string): Promise<void> => {
    const user = await UserModel.findOne({ phone });
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.phoneOtp) {
      throw new AppError('No active phone OTP found', 400, 'OTP_NOT_FOUND');
    }

    if (user.phoneOtp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new AppError('Phone OTP attempts exceeded', 429, 'OTP_ATTEMPTS_EXCEEDED');
    }

    if (user.phoneOtp.expiresAt.getTime() < Date.now()) {
      throw new AppError('Phone OTP expired', 400, 'OTP_EXPIRED');
    }

    if (user.phoneOtp.code !== otp) {
      user.phoneOtp.attempts += 1;
      await user.save();
      throw new AppError('Invalid phone OTP', 400, 'OTP_INVALID');
    }

    user.phoneVerified = true;
    user.phoneOtp = undefined;
    await user.save();
  },

  login: async (input: LoginInput): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() });

    if (!user) {
      logAuthAudit(
        {
          event: 'auth.login.failure.user_not_found',
          email: input.email.toLowerCase(),
        },
        'warn',
      );
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      logAuthAudit(
        {
          event: 'auth.login.failure.account_locked',
          userId: user.id,
          email: user.email,
        },
        'warn',
      );
      throw new AppError('Account is temporarily locked. Please try again later.', 423, 'ACCOUNT_LOCKED');
    }

    const isPasswordMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
        user.failedLoginAttempts = 0;
      }

      await user.save();
      logAuthAudit(
        {
          event: 'auth.login.failure.invalid_password',
          userId: user.id,
          email: user.email,
          metadata: {
            failedLoginAttempts: user.failedLoginAttempts,
            lockUntil: user.lockUntil?.toISOString(),
          },
        },
        'warn',
      );
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const { accessToken, refreshToken } = buildAuthTokens(user);

    logAuthAudit({
      event: 'auth.login.success',
      userId: user.id,
      email: user.email,
    });

    return { user, accessToken, refreshToken };
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await UserModel.findById(decoded.sub);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AppError('Refresh token is no longer valid', 401, 'INVALID_REFRESH_TOKEN');
    }

    return buildAuthTokens(user);
  },

  logout: async (refreshToken: string): Promise<void> => {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(decoded.sub);

    if (!user) {
      return;
    }

    user.tokenVersion += 1;
    await user.save();

    logAuthAudit({
      event: 'auth.logout.success',
      userId: user.id,
      email: user.email,
    });
  },

  forgotPassword: async (email: string): Promise<{ resetToken?: string }> => {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return {};
    }

    const token = generatePasswordResetToken();
    user.passwordResetToken = token;
    user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await user.save();

    logAuthAudit({
      event: 'auth.password_reset.requested',
      userId: user.id,
      email: user.email,
    });

    return { resetToken: token };
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400, 'RESET_TOKEN_INVALID');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    user.tokenVersion += 1;
    await user.save();

    logAuthAudit({
      event: 'auth.password_reset.completed',
      userId: user.id,
      email: user.email,
    });
  },

  me: async (userId: string): Promise<IUser> => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  },

  updateMe: async (userId: string, input: UpdateProfileInput): Promise<IUser> => {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (input.fullName !== undefined) {
      user.fullName = input.fullName;
    }

    await user.save();

    logAuthAudit({
      event: 'auth.profile.updated',
      userId: user.id,
      email: user.email,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return user;
  },
};

import type { Request, Response } from 'express';

import config from '../../config/env.js';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { authService } from './auth.service.js';
import { authValidators } from './auth.validation.js';

const validate = <T>(schema: { validate: (value: unknown) => { error?: { message: string }; value: T } }, payload: unknown): T => {
  const result = schema.validate(payload);
  if (result.error) {
    throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  }
  return result.value;
};

const allowDebugOtp = config.otp_debug_mode;

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.register, req.body);
    const { user, emailOtp, phoneOtp } = await authService.register(payload);

    res.status(201).json({
      success: true,
      data: {
        user,
        ...(allowDebugOtp ? { debugOtp: { emailOtp, phoneOtp } } : {}),
      },
      meta: {
        message: 'Registration successful. Verify email and phone OTP.',
      },
    });
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.verifyEmail, req.body);
    await authService.verifyEmail(payload.email, payload.otp);

    res.status(200).json({
      success: true,
      data: {
        verified: true,
      },
      meta: {
        message: 'Email verified successfully.',
      },
    });
  }),

  resendEmailOtp: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.resendEmailOtp, req.body);
    const result = await authService.resendEmailOtp(payload.email);

    res.status(200).json({
      success: true,
      data: {
        resent: true,
        ...(allowDebugOtp ? { debugOtp: result.emailOtp } : {}),
      },
      meta: {
        message: 'Email OTP resent successfully.',
      },
    });
  }),

  verifyPhone: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.verifyPhone, req.body);
    await authService.verifyPhone(payload.phone, payload.otp);

    res.status(200).json({
      success: true,
      data: {
        verified: true,
      },
      meta: {
        message: 'Phone verified successfully.',
      },
    });
  }),

  resendPhoneOtp: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.resendPhoneOtp, req.body);
    const result = await authService.resendPhoneOtp(payload.phone);

    res.status(200).json({
      success: true,
      data: {
        resent: true,
        ...(allowDebugOtp ? { debugOtp: result.phoneOtp } : {}),
      },
      meta: {
        message: 'Phone OTP resent successfully.',
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.login, req.body);
    const { user, accessToken, refreshToken } = await authService.login(payload);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
      },
      meta: {
        message: 'Login successful.',
      },
    });
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.refreshToken, req.body);
    const tokens = await authService.refreshToken(payload.refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
      meta: {
        message: 'Token refreshed successfully.',
      },
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.logout, req.body);
    await authService.logout(payload.refreshToken);

    res.status(200).json({
      success: true,
      data: null,
      meta: {
        message: 'Logout successful.',
      },
    });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.forgotPassword, req.body);
    const result = await authService.forgotPassword(payload.email);

    res.status(200).json({
      success: true,
      data: {
        ...(allowDebugOtp && result.resetToken ? { debugResetToken: result.resetToken } : {}),
      },
      meta: {
        message: 'If this email exists, a reset flow has been initiated.',
      },
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const payload = validate(authValidators.resetPassword, req.body);
    await authService.resetPassword(payload.token, payload.newPassword);

    res.status(200).json({
      success: true,
      data: null,
      meta: {
        message: 'Password reset successful.',
      },
    });
  }),

  me: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await authService.me(req.auth.userId);
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  }),

  updateMe: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const payload = validate(authValidators.updateMe, req.body);
    const user = await authService.updateMe(req.auth.userId, payload);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
      meta: {
        message: 'Profile updated successfully.',
      },
    });
  }),
};

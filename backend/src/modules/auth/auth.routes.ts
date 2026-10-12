import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { createErrorResponse } from '../../common/errors/errorResponse.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/authorization.middleware.js';
import { authController } from './auth.controller.js';

const authRouter = Router();
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(
        createErrorResponse(
          'LOGIN_RATE_LIMITED',
          'Too many login attempts. Please try again in 15 minutes.',
        ),
      );
  },
});

authRouter.post('/register', authController.register);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.post('/resend-email-otp', authController.resendEmailOtp);
authRouter.post('/verify-phone', authController.verifyPhone);
authRouter.post('/resend-phone-otp', authController.resendPhoneOtp);
authRouter.post('/login', loginRateLimiter, authController.login);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.get('/me', authenticate, authController.me);
authRouter.get('/admin/stats', authenticate, requireAdmin, authController.adminStats);
authRouter.patch('/me', authenticate, authController.updateMe);

export default authRouter;

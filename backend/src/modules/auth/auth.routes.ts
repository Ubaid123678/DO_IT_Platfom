import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { authController } from './auth.controller.js';

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.post('/verify-phone', authController.verifyPhone);
authRouter.post('/login', authController.login);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.post('/logout', authController.logout);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.get('/me', authenticate, authController.me);
authRouter.patch('/me', authenticate, authController.updateMe);

export default authRouter;

import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../common/errors/AppError.js';
import { verifyAccessToken } from '../modules/auth/auth.utils.js';

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: string;
    email: string;
  };
};

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Authorization token is required', 401, 'UNAUTHORIZED'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyAccessToken(token);
    req.auth = {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (_error) {
    next(new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN'));
  }
};

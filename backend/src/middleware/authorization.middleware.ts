import type { NextFunction, Response } from 'express';

import { AppError } from '../common/errors/AppError.js';
import type { AuthenticatedRequest } from './auth.middleware.js';

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
};

import type { Response } from 'express';

import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { adminService } from './admin.service.js';
import { adminValidators } from './admin.validation.js';
import type {
  AdminUserListQuery,
  AdminUserUpdateInput,
} from './admin.types.js';

const validate = <T>(
  schema: {
    validate: (value: unknown) => { error?: { message: string }; value: T };
  },
  payload: unknown,
): T => {
  const result = schema.validate(payload);
  if (result.error)
    throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  return result.value;
};

const getAdminId = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.userId;
};

export const adminController = {
  getDashboardStats: asyncHandler(
    async (_req: AuthenticatedRequest, res: Response) => {
      const result = await adminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: result,
        meta: { message: 'Dashboard statistics fetched successfully' },
      });
    },
  ),

  listUsers: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate<AdminUserListQuery>(
      adminValidators.listUsers,
      req.query,
    );
    const result = await adminService.listUsers(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Users fetched successfully' },
    });
  }),

  getUserDetail: asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = validate<string>(
        adminValidators.userId,
        req.params.userId,
      );
      const result = await adminService.getUserDetail(userId);
      res.status(200).json({
        success: true,
        data: result,
        meta: { message: 'User details fetched successfully' },
      });
    },
  ),

  updateUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = getAdminId(req);
    const userId = validate<string>(adminValidators.userId, req.params.userId);
    const input = validate<AdminUserUpdateInput>(
      adminValidators.updateUser,
      req.body,
    );
    const result = await adminService.updateUser(adminId, userId, input);
    res.status(200).json({
      success: true,
      data: { user: result },
      meta: { message: 'User updated successfully' },
    });
  }),

  deleteUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = getAdminId(req);
    const userId = validate<string>(adminValidators.userId, req.params.userId);
    const input = validate<{ reason?: string }>(
      adminValidators.deleteUser,
      req.body ?? {},
    );
    const result = await adminService.deleteUser(adminId, userId, input.reason);
    res.status(200).json({
      success: true,
      data: { user: result },
      meta: { message: 'User deactivated successfully' },
    });
  }),
};

import type { Response } from 'express';

import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { kycService } from './kyc.service.js';
import { kycValidators } from './kyc.validation.js';

const validate = <T>(schema: { validate: (value: unknown) => { error?: { message: string }; value: T } }, payload: unknown): T => {
  const result = schema.validate(payload);
  if (result.error) {
    throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  }

  return result.value;
};

const getAuthenticatedUserId = (req: AuthenticatedRequest): string => {
  if (!req.auth) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return req.auth.userId;
};

export const kycController = {
  getProviderStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const status = await kycService.getProviderStatus(userId);

    res.status(200).json({
      success: true,
      data: status,
      meta: {
        message: 'KYC status fetched successfully.',
      },
    });
  }),

  getRestrictedAccess: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const result = await kycService.getRestrictedAccess(userId);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        message: 'KYC access state fetched successfully.',
      },
    });
  }),

  createUploadUrl: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const payload = validate(kycValidators.uploadUrl, req.body);
    const result = await kycService.createUploadUrl(userId, payload);

    res.status(201).json({
      success: true,
      data: result,
      meta: {
        message: 'Signed KYC upload URL generated successfully.',
      },
    });
  }),

  submitKyc: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const payload = validate(kycValidators.submit, req.body);
    const document = await kycService.submitKyc(userId, payload);

    res.status(201).json({
      success: true,
      data: {
        document,
      },
      meta: {
        message: 'KYC submission saved successfully.',
      },
    });
  }),

  resubmitKyc: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const payload = validate(kycValidators.submit, req.body);
    const document = await kycService.resubmitKyc(userId, payload);

    res.status(201).json({
      success: true,
      data: {
        document,
      },
      meta: {
        message: 'KYC resubmission saved successfully.',
      },
    });
  }),

  listSubmissions: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const query = validate(kycValidators.statusQuery, req.query);
    const submissions = await kycService.listSubmissions(userId, query.status);

    res.status(200).json({
      success: true,
      data: {
        submissions,
      },
      meta: {
        message: 'KYC submissions fetched successfully.',
      },
    });
  }),

  approveSubmission: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reviewerId = getAuthenticatedUserId(req);
    const payload = validate(kycValidators.review, { ...req.body, action: 'approve' });
    const result = await kycService.reviewSubmission(reviewerId, req.params.userId, 'approve', payload.reason);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        message: 'KYC submission approved successfully.',
      },
    });
  }),

  rejectSubmission: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reviewerId = getAuthenticatedUserId(req);
    const payload = validate(kycValidators.review, { ...req.body, action: 'reject' });
    const result = await kycService.reviewSubmission(reviewerId, req.params.userId, 'reject', payload.reason);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        message: 'KYC submission rejected successfully.',
      },
    });
  }),
};

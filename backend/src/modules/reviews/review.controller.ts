import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { reviewService } from './review.service.js';
import { reviewValidators } from './review.validation.js';

const validate = <T>(
  schema: { validate: (value: unknown) => { error?: { message: string }; value: T } },
  payload: unknown
): T => {
  const result = schema.validate(payload);
  if (result.error) throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  return result.value;
};

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.userId;
};

const getUserRole = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.role;
};

export const reviewController = {
  createReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(reviewValidators.createReview, req.body);
    const review = await reviewService.createReview({ ...payload, reviewerId: userId });
    res.status(201).json({
      success: true,
      data: { review },
      meta: { message: 'Review created successfully' },
    });
  }),

  getReviewById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const review = await reviewService.getReviewById(req.params.reviewId, userId);
    res.status(200).json({
      success: true,
      data: { review },
      meta: { message: 'Review fetched successfully' },
    });
  }),

  updateReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(reviewValidators.updateReview, req.body);
    const review = await reviewService.updateReview(req.params.reviewId, userId, payload);
    res.status(200).json({
      success: true,
      data: { review },
      meta: { message: 'Review updated successfully' },
    });
  }),

  deleteReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const result = await reviewService.deleteReview(req.params.reviewId, userId);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Review deleted successfully' },
    });
  }),

  flagReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(reviewValidators.flagReview, req.body);
    const review = await reviewService.flagReview({ reviewId: req.params.reviewId, userId, reason: payload.reason });
    res.status(200).json({
      success: true,
      data: { review },
      meta: { message: 'Review flagged successfully' },
    });
  }),

  moderateReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }
    const adminId = getUserId(req);
    const payload = validate(reviewValidators.moderateReview, req.body);
    const review = await reviewService.moderateReview({ reviewId: req.params.reviewId, adminId, ...payload });
    res.status(200).json({
      success: true,
      data: { review },
      meta: { message: `Review ${payload.action}d successfully` },
    });
  }),

  getReviews: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate(reviewValidators.getReviews, req.query);
    const result = await reviewService.getReviews(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Reviews fetched successfully' },
    });
  }),

  getReviewsByJob: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate(reviewValidators.getReviews, req.query);
    const result = await reviewService.getReviewsByJob(req.params.jobId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Job reviews fetched successfully' },
    });
  }),

  getReviewsByUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(reviewValidators.getReviews, req.query);
    const result = await reviewService.getReviewsByUser(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'User reviews fetched successfully' },
    });
  }),

  getReviewStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { revieweeId } = req.params;
    const stats = await reviewService.getReviewStats(revieweeId);
    res.status(200).json({
      success: true,
      data: { stats },
      meta: { message: 'Review statistics fetched successfully' },
    });
  }),

  getRatingDistribution: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { revieweeId } = req.params;
    const distribution = await reviewService.getRatingDistribution(revieweeId);
    res.status(200).json({
      success: true,
      data: { distribution },
      meta: { message: 'Rating distribution fetched successfully' },
    });
  }),

  markHelpful: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const review = await reviewService.markHelpful(req.params.reviewId, userId);
    res.status(200).json({
      success: true,
      data: { review },
      meta: { message: 'Review marked as helpful' },
    });
  }),
};
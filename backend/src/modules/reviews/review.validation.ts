import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();

export const reviewValidators = {
  createReview: Joi.object({
    jobId: objectId,
    proposalId: objectId,
    revieweeId: objectId,
    reviewerRole: Joi.string().valid('client', 'provider').required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().trim().max(100).optional(),
    content: Joi.string().trim().max(2000).optional(),
    communication: Joi.number().integer().min(1).max(5).optional(),
    quality: Joi.number().integer().min(1).max(5).optional(),
    timeliness: Joi.number().integer().min(1).max(5).optional(),
    professionalism: Joi.number().integer().min(1).max(5).optional(),
  }),

  updateReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    title: Joi.string().trim().max(100).optional(),
    content: Joi.string().trim().max(2000).optional(),
    communication: Joi.number().integer().min(1).max(5).optional(),
    quality: Joi.number().integer().min(1).max(5).optional(),
    timeliness: Joi.number().integer().min(1).max(5).optional(),
    professionalism: Joi.number().integer().min(1).max(5).optional(),
  }).min(1),

  flagReview: Joi.object({
    reason: Joi.string().trim().min(5).max(500).required(),
  }),

  moderateReview: Joi.object({
    action: Joi.string().valid('approve', 'remove').required(),
    reason: Joi.string().max(500).optional(),
  }),

  getReviews: Joi.object({
    status: Joi.string().valid('pending', 'published', 'flagged', 'removed').optional(),
    revieweeId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    reviewerId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).optional(),
    jobId: objectId.optional(),
    sortBy: Joi.string().valid('createdAt', 'rating', 'helpfulCount').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    limit: Joi.number().integer().min(1).max(50).default(20),
    skip: Joi.number().integer().min(0).default(0),
  }),

  getReviewById: Joi.object({
    reviewId: objectId,
  }),

  getReviewStats: Joi.object({
    revieweeId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required(),
  }),

  markHelpful: Joi.object({
    reviewId: objectId,
  }),
};
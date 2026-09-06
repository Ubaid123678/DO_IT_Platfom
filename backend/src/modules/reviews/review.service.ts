import { AppError } from '../../common/errors/AppError.js';
import { ReviewModel, type IReview } from './review.model.js';
import { JobModel } from '../jobs/job.model.js';
import { ProposalModel } from '../proposals/proposal.model.js';
import UserModel from '../auth/auth.model.js';

const serializeReview = (review: IReview) => {
  const obj = review.toJSON?.() ?? review;
  return obj;
};

const serializeReviewList = (reviews: IReview[]) => reviews.map(serializeReview);

interface CreateReviewInput {
  jobId: string;
  proposalId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'client' | 'provider';
  rating: number;
  title?: string;
  content?: string;
  communication?: number;
  quality?: number;
  timeliness?: number;
  professionalism?: number;
}

interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
  communication?: number;
  quality?: number;
  timeliness?: number;
  professionalism?: number;
}

interface FlagReviewInput {
  reviewId: string;
  userId: string;
  reason: string;
}

interface ModerateReviewInput {
  reviewId: string;
  adminId: string;
  action: 'approve' | 'remove';
  reason?: string;
}

interface GetReviewsOptions {
  status?: 'pending' | 'published' | 'flagged' | 'removed';
  revieweeId?: string;
  reviewerId?: string;
  jobId?: string;
  sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export const reviewService = {
  createReview: async (input: CreateReviewInput) => {
    const { jobId, proposalId, reviewerId, revieweeId, reviewerRole, rating, title, content, communication, quality, timeliness, professionalism } = input;

    // Verify job and proposal
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    // Verify job is completed
    if (job.status !== 'completed') {
      throw new AppError('Can only review completed jobs', 400, 'JOB_NOT_COMPLETED');
    }

    // Verify proposal was accepted for this job
    if (proposal.jobId.toString() !== jobId) {
      throw new AppError('Proposal does not belong to this job', 400, 'PROPOSAL_JOB_MISMATCH');
    }

    // Verify proposal was accepted
    if (proposal.status !== 'accepted') {
      throw new AppError('Can only review accepted proposals', 400, 'PROPOSAL_NOT_ACCEPTED');
    }

    // Verify reviewer is part of the job
    const isClient = job.client.clientId.toString() === reviewerId;
    const isProvider = job.provider.providerId?.toString() === reviewerId;
    if (!isClient && !isProvider) {
      throw new AppError('Only job participants can leave reviews', 403, 'NOT_JOB_PARTICIPANT');
    }

    // Verify reviewee is the other party
    const expectedRevieweeId = isClient ? job.provider.providerId : job.client.clientId;
    if (revieweeId !== expectedRevieweeId.toString()) {
      throw new AppError('Invalid reviewee', 400, 'INVALID_REVIEWEE');
    }

    // Check if review already exists
    const existingReview = await ReviewModel.findOne({ jobId, reviewerId });
    if (existingReview) {
      throw new AppError('You have already reviewed this job', 409, 'REVIEW_EXISTS');
    }

    // Verify reviewee exists and is a user
    const reviewee = await UserModel.findById(revieweeId);
    if (!reviewee) throw new AppError('Reviewee not found', 404, 'REVIEWEE_NOT_FOUND');

    const review = await ReviewModel.create({
      jobId,
      proposalId,
      reviewerId,
      revieweeId,
      reviewerRole,
      rating,
      title,
      content,
      communication,
      quality,
      timeliness,
      professionalism,
      status: 'published',
    });

    return serializeReview(review);
  },

  getReviewById: async (reviewId: string, userId: string) => {
    const review = await ReviewModel.findById(reviewId)
      .populate('jobId', 'title status')
      .populate('proposalId', 'title')
      .populate('reviewerId', 'fullName')
      .populate('revieweeId', 'fullName')
      .populate('flaggedBy', 'fullName')
      .populate('moderatedBy', 'fullName')
      .lean();

    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    // Check if user can view this review
    const isReviewer = review.reviewerId.toString() === userId;
    const isReviewee = review.revieweeId.toString() === userId;
    const isPublic = review.status === 'published' && review.isPublic;

    if (!isReviewer && !isReviewee && !isPublic) {
      throw new AppError('Not authorized to view this review', 403, 'NOT_AUTHORIZED');
    }

    return serializeReview(review);
  },

  updateReview: async (reviewId: string, userId: string, input: UpdateReviewInput) => {
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    if (review.reviewerId.toString() !== userId) {
      throw new AppError('Only the reviewer can edit this review', 403, 'NOT_AUTHORIZED');
    }

    if (review.status !== 'published') {
      throw new AppError('Can only edit published reviews', 400, 'REVIEW_NOT_EDITABLE');
    }

    // Update fields
    for (const key of Object.keys(input)) {
      if (input[key as keyof UpdateReviewInput] !== undefined) {
        (review as any)[key] = input[key as keyof UpdateReviewInput];
      }
    }

    await review.save();
    return serializeReview(review);
  },

  deleteReview: async (reviewId: string, userId: string) => {
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    if (review.reviewerId.toString() !== userId) {
      throw new AppError('Only the reviewer can delete this review', 403, 'NOT_AUTHORIZED');
    }

    await review.deleteOne();
    return { success: true, message: 'Review deleted' };
  },

  flagReview: async (input: FlagReviewInput) => {
    const { reviewId, userId, reason } = input;

    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    if (review.revieweeId.toString() === userId) {
      throw new AppError('Cannot flag your own review', 400, 'CANNOT_FLAG_OWN_REVIEW');
    }

    if (review.status !== 'published') {
      throw new AppError('Can only flag published reviews', 400, 'REVIEW_NOT_FLAGGABLE');
    }

    await review.flag(userId, reason);
    return serializeReview(review);
  },

  moderateReview: async (input: ModerateReviewInput) => {
    const { reviewId, adminId, action, reason } = input;

    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    await review.moderate(adminId, action, reason);
    return serializeReview(review);
  },

  markHelpful: async (reviewId: string, userId: string) => {
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    if (review.revieweeId.toString() === userId) {
      throw new AppError('Cannot mark your own review as helpful', 400, 'CANNOT_MARK_OWN');
    }

    await review.incrementHelpful();
    return serializeReview(review);
  },

  getReviews: async (options: GetReviewsOptions = {}) => {
    const filter: any = {};
    if (options.status) filter.status = options.status;
    if (options.revieweeId) filter.revieweeId = options.revieweeId;
    if (options.reviewerId) filter.reviewerId = options.reviewerId;
    if (options.jobId) filter.jobId = options.jobId;

    const sort: Record<string, 1 | -1> = {};
    sort[options.sortBy || 'createdAt'] = options.sortOrder === 'asc' ? 1 : -1;

    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort(sort)
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('reviewerId', 'fullName')
        .populate('revieweeId', 'fullName')
        .populate('jobId', 'title')
        .lean(),
      ReviewModel.countDocuments(filter),
    ]);

    return {
      reviews: serializeReviewList(reviews),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  getReviewsByJob: async (jobId: string, options: { status?: string; limit?: number; skip?: number } = {}) => {
    const filter: any = { jobId };
    if (options.status) filter.status = options.status;

    const reviews = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .populate('reviewerId', 'fullName')
      .populate('revieweeId', 'fullName')
      .lean();

    const total = await ReviewModel.countDocuments(filter);

    return {
      reviews: serializeReviewList(reviews),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  getReviewsByUser: async (userId: string, options: { status?: string; limit?: number; skip?: number } = {}) => {
    const filter: any = {
      $or: [{ reviewerId: userId }, { revieweeId: userId }],
    };
    if (options.status) filter.status = options.status;

    const reviews = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .populate('reviewerId', 'fullName')
      .populate('revieweeId', 'fullName')
      .populate('jobId', 'title')
      .lean();

    const total = await ReviewModel.countDocuments(filter);

    return {
      reviews: serializeReviewList(reviews),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  getReviewStats: async (revieweeId: string) => {
    return ReviewModel.getAverageRating(revieweeId);
  },

  getRatingDistribution: async (revieweeId: string) => {
    return ReviewModel.getRatingDistribution(revieweeId);
  },

  markHelpful: async (reviewId: string, userId: string) => {
    const review = await ReviewModel.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');

    if (review.revieweeId.toString() === userId) {
      throw new AppError('Cannot mark your own review as helpful', 400, 'CANNOT_MARK_OWN');
    }

    await review.incrementHelpful();
    return serializeReview(review);
  },
};
import { api } from './api';

export type ReviewStatus = 'pending' | 'published' | 'flagged' | 'removed';

export interface IReview {
  _id: string;
  jobId: string;
  proposalId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'client' | 'provider';
  rating: number; // 1-5
  title?: string;
  content?: string;
  communication?: number; // 1-5
  quality?: number; // 1-5
  timeliness?: number; // 1-5
  professionalism?: number; // 1-5
  status: ReviewStatus;
  flaggedAt?: string;
  flaggedBy?: string;
  flagReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
  isPublic: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  job?: {
    _id: string;
    title: string;
    type: string;
    status: string;
    location: any;
    budget: any;
  };
  provider?: {
    _id: string;
    fullName: string;
    provider_profile?: {
      avatar_url?: string;
      headline?: string;
      bio?: string;
      city?: string;
    };
  };
  client?: {
    _id: string;
    fullName: string;
  };
  reviewer?: {
    _id: string;
    fullName: string;
  };
  reviewee?: {
    _id: string;
    fullName: string;
  };
  clientResponse?: {
    message?: string;
    respondedBy: string;
  };
  providerResponse?: {
    message?: string;
    respondedBy: string;
  };
  bidTotal?: number;
}

export type ReviewStatus = 'pending' | 'published' | 'flagged' | 'removed';

export interface ReviewQueryParams {
  status?: 'pending' | 'published' | 'flagged' | 'removed' | 'all';
  revieweeId?: string;
  reviewerId?: string;
  jobId?: string;
  sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ReviewListResponse {
  reviews: IReview[];
  total: number;
  limit: number;
  skip: number;
}

export interface CreateReviewPayload {
  jobId: string;
  proposalId: string;
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

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  content?: string;
  communication?: number;
  quality?: number;
  timeliness?: number;
  professionalism?: number;
}

export interface FlagReviewPayload {
  reason: string;
}

export interface ModerateReviewPayload {
  action: 'approve' | 'remove';
  message?: string;
}

export interface ReviewListResponse {
  reviews: IReview[];
  total: number;
  limit: number;
  skip: number;
}

export interface CreateReviewPayload {
  jobId: string;
  proposalId: string;
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

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  content?: string;
  communication?: number;
  quality?: number;
  timeliness?: number;
  professionalism?: number;
}

export interface FlagReviewPayload {
  reason: string;
}

export interface ModerateReviewPayload {
  action: 'approve' | 'remove';
  message?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  avgCommunication: number;
  avgQuality: number;
  avgTimeliness: number;
  avgProfessionalism: number;
  ratingDistribution: Record<number, number>;
}

export const reviewService = {
  // Create a review for a completed job
  createReview: async (payload: CreateReviewPayload): Promise<IReview> => {
    const res = await api.post('/reviews', payload);
    return res.data.data.review;
  },

  // Get single review by ID
  getReviewById: async (reviewId: string): Promise<IReview> => {
    const res = await api.get(`/reviews/${reviewId}`);
    return res.data.data.review;
  },

  // Update a review (only by reviewer)
  updateReview: async (reviewId: string, payload: UpdateReviewPayload): Promise<IReview> => {
    const res = await api.patch(`/reviews/${reviewId}`, payload);
    return res.data.data.review;
  },

  // Delete a review
  deleteReview: async (reviewId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data.data;
  },

  // Flag a review
  flagReview: async (reviewId: string, reason: string): Promise<IReview> => {
    const res = await api.post(`/reviews/${reviewId}/flag`, { reason });
    return res.data.data.review;
  },

  // Get reviews with filters
  getReviews: async (params: {
    status?: 'pending' | 'published' | 'flagged' | 'removed' | 'all';
    revieweeId?: string;
    reviewerId?: string;
    jobId?: string;
    sortBy?: 'createdAt' | 'rating' | 'helpfulCount';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    skip?: number;
  } = {}): Promise<ReviewListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/reviews?${queryParams.toString()}`);
    return res.data.data;
  },

  // Get reviews for a specific job
  getReviewsByJob: async (jobId: string, params: {
    status?: 'pending' | 'published' | 'flagged' | 'removed' | 'all';
    limit?: number;
    skip?: number;
  } = {}): Promise<ReviewListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/reviews/job/${jobId}?${queryParams.toString()}`);
    return res.data.data;
  },

  // Get reviews by current user (as reviewer or reviewee)
  getMyReviews: async (params: {
    status?: 'pending' | 'published' | 'flagged' | 'removed' | 'all';
    limit?: number;
    skip?: number;
  } = {}): Promise<ReviewListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/reviews/user?${queryParams.toString()}`);
    return res.data.data;
  },

  // Get review statistics for a user
  getReviewStats: async (revieweeId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    avgCommunication: number;
    avgQuality: number;
    avgTimeliness: number;
    avgProfessionalism: number;
  }> => {
    const res = await api.get(`/reviews/stats/${revieweeId}`);
    return res.data.data.stats;
  },

  // Get rating distribution for a user
  getRatingDistribution: async (revieweeId: string): Promise<Record<number, number>> => {
    const res = await api.get(`/reviews/distribution/${revieweeId}`);
    return res.data.data.distribution;
  },

  // Mark review as helpful
  markHelpful: async (reviewId: string): Promise<IReview> => {
    const res = await api.post(`/reviews/${reviewId}/helpful`);
    return res.data.data.review;
  },

  // Admin: Moderate a review
  moderateReview: async (reviewId: string, action: 'approve' | 'remove', message?: string): Promise<IReview> => {
    const res = await api.post(`/reviews/${reviewId}/moderate`, { action, message });
    return res.data.data.review;
  },
};
import { api } from './api';

export type JobType = 'physical' | 'digital' | 'errand';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'resolved';
export type BudgetType = 'fixed' | 'hourly';

export interface JobLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  country?: string;
  formattedAddress?: string;
}

export interface JobBudget {
  type: BudgetType;
  amount: number; // in USD cents
  currency: string;
  hourlyRate?: number;
  estimatedHours?: number;
}

export interface JobSchedule {
  startsAt?: string;
  endsAt?: string;
  timezone: string;
  isFlexible: boolean;
  preferredDays?: string[];
  preferredShifts?: string[];
}

export interface JobRequirements {
  categories: string[];
  skillItems?: string[];
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  languages?: string[];
  certificationsRequired?: boolean;
  vehicleRequired?: boolean;
}

export interface JobClientInfo {
  clientId: string;
  clientName?: string;
  clientAvatar?: string;
}

export interface JobProviderInfo {
  providerId?: string;
  providerName?: string;
  providerAvatar?: string;
  acceptedProposalId?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface JobEscrow {
  lockedAmount: number;
  lockedAt?: string;
  releasedAt?: string;
  platformFeeAmount: number;
  platformFeePercent: number;
  transactionId?: string;
}

export interface JobDispute {
  disputeId?: string;
  raisedBy?: 'client' | 'provider';
  raisedAt?: string;
  reason?: string;
  status?: 'open' | 'under_review' | 'resolved';
  resolution?: 'client_wins' | 'provider_wins' | 'split';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface JobReview {
  clientReview?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  providerReview?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  type: JobType;
  status: JobStatus;
  location: JobLocation;
  budget: JobBudget;
  schedule: JobSchedule;
  requirements: JobRequirements;
  client: JobClientInfo;
  provider: JobProviderInfo;
  escrow: JobEscrow;
  dispute: JobDispute;
  review: JobReview;
  metadata: {
    views: number;
    applicationsCount: number;
    source?: string;
    tags?: string[];
    isUrgent?: boolean;
    isFeatured?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  isAssignedProvider?: boolean;
}

export interface BrowseJobsParams {
  type?: JobType;
  category?: string;
  skillItem?: string;
  status?: JobStatus;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: BudgetType;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  city?: string;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  isUrgent?: boolean;
  isFeatured?: boolean;
  sortBy?: 'createdAt' | 'budget' | 'distance' | 'urgency';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
  search?: string;
}

export interface BrowseJobsResponse {
  jobs: Job[];
  total: number;
  limit: number;
  skip: number;
}

export interface ClientJobsParams {
  status?: JobStatus;
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ProviderJobsParams {
  status?: JobStatus;
  type?: JobType;
  sortBy?: 'createdAt' | 'budget' | 'distance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface JobStats {
  open: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  disputed: number;
  resolved: number;
}

export const jobService = {
  // Client: Create a new job
  createJob: async (payload: {
    title: string;
    description: string;
    type: JobType;
    location: JobLocation;
    budget: JobBudget;
    schedule: JobSchedule;
    requirements: JobRequirements;
    metadata?: { tags?: string[]; isUrgent?: boolean };
  }): Promise<Job> => {
    const res = await api.post('/jobs', payload);
    return res.data.data.job;
  },

  // Get single job by ID
  getJobById: async (jobId: string): Promise<Job> => {
    const res = await api.get(`/jobs/${jobId}`);
    return res.data.data.job;
  },

  // Client: Update a job (only when open)
  updateJob: async (jobId: string, payload: Partial<{
    title: string;
    description: string;
    location: JobLocation;
    budget: JobBudget;
    schedule: JobSchedule;
    requirements: JobRequirements;
    metadata: { tags?: string[]; isUrgent?: boolean; isFeatured?: boolean };
  }>): Promise<Job> => {
    const res = await api.patch(`/jobs/${jobId}`, payload);
    return res.data.data.job;
  },

  // Client: Delete a job
  deleteJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/jobs/${jobId}`);
    return res.data.data;
  },

  // Public browse with filters and geo search
  browseJobs: async (params: BrowseJobsParams = {}): Promise<BrowseJobsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/jobs/browse?${queryParams.toString()}`);
    return res.data.data;
  },

  // Search jobs
  searchJobs: async (query: string, filters: Partial<BrowseJobsParams> = {}): Promise<BrowseJobsResponse> => {
    const res = await api.get('/jobs/search', { params: { ...filters, search: query } });
    return res.data.data;
  },

  // Client: Get my jobs
  getClientJobs: async (params: ClientJobsParams = {}): Promise<BrowseJobsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/jobs/client?${queryParams.toString()}`);
    return res.data.data;
  },

  // Provider: Get my assigned jobs
  getProviderJobs: async (params: ProviderJobsParams = {}): Promise<BrowseJobsResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/jobs/provider?${queryParams.toString()}`);
    return res.data.data;
  },

  // Transition job status
  transitionStatus: async (jobId: string, status: JobStatus): Promise<Job> => {
    const res = await api.post(`/jobs/${jobId}/status`, { status });
    return res.data.data.job;
  },

  // Assign provider to job (client only)
  assignProvider: async (jobId: string, providerId: string, proposalId: string): Promise<Job> => {
    const res = await api.post(`/jobs/${jobId}/assign-provider`, { providerId, proposalId });
    return res.data.data.job;
  },

  // Get job statistics
  getJobStats: async (): Promise<JobStats> => {
    const res = await api.get('/jobs/client/stats');
    return res.data.data.stats;
  },

  // Get provider job statistics
  getProviderJobStats: async (): Promise<JobStats> => {
    const res = await api.get('/jobs/provider/stats');
    return res.data.data.stats;
  },
};
import { api } from './api';

export type ProposalStatus = 'submitted' | 'withdrawn' | 'accepted' | 'rejected' | 'expired';
export type BidType = 'fixed' | 'hourly';

export interface Proposal {
  _id: string;
  jobId: string;
  providerId: string;
  clientId: string;
  bidAmount: number;
  bidType: BidType;
  hourlyRate?: number;
  estimatedHours?: number;
  coverLetter: string;
  estimatedTimeline: string;
  status: ProposalStatus;
  submittedAt: string;
  respondedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
  clientResponse?: {
    message?: string;
    respondedBy: string;
  };
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
  bidTotal?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalQueryParams {
  status?: ProposalStatus;
  jobId?: string;
  sortBy?: 'createdAt' | 'bidAmount' | 'submittedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

export interface ProposalListResponse {
  proposals: Proposal[];
  total: number;
  limit: number;
  skip: number;
}

export interface ClientProposalAction {
  action: 'accept' | 'reject';
  message?: string;
}

export interface ProposalStats {
  submitted: { count: number; avgBid?: number; minBid?: number; maxBid?: number };
  withdrawn: { count: number };
  accepted: { count: number };
  rejected: { count: number };
  expired: { count: number };
}

export interface MatchingProvider {
  providerId: string;
  fullName: string;
  avatarUrl?: string;
  rating: number;
  distance?: number;
  skillOverlap: number;
  verifiedCategories: string[];
  serviceRadius?: number;
  isAvailable: boolean;
  matchScore: number;
}

export interface MatchingResult {
  jobId: string;
  matches: MatchingProvider[];
  totalCandidates: number;
  notified: number;
}

export const proposalService = {
  // Provider: Submit a proposal for a job
  createProposal: async (payload: {
    jobId: string;
    bidAmount: number;
    bidType: BidType;
    hourlyRate?: number;
    estimatedHours?: number;
    coverLetter: string;
    estimatedTimeline: string;
  }): Promise<Proposal> => {
    const res = await api.post('/proposals', payload);
    return res.data.data.proposal;
  },

  // Get single proposal by ID
  getProposalById: async (proposalId: string): Promise<Proposal> => {
    const res = await api.get(`/proposals/${proposalId}`);
    return res.data.data.proposal;
  },

  // Client: Get proposals for a specific job
  getProposalsForJob: async (jobId: string, params: ProposalQueryParams = {}): Promise<ProposalListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/proposals/job/${jobId}?${queryParams.toString()}`);
    return res.data.data;
  },

  // Client: Get proposal statistics for a job
  getJobProposalStats: async (jobId: string): Promise<ProposalStats> => {
    const res = await api.get(`/proposals/job/${jobId}/stats`);
    return res.data.data.stats;
  },

  // Provider: Get my proposals
  getProviderProposals: async (params: ProposalQueryParams = {}): Promise<ProposalListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/proposals/my?${queryParams.toString()}`);
    return res.data.data;
  },

  // Client: Accept a proposal
  acceptProposal: async (proposalId: string, message?: string): Promise<Proposal> => {
    const res = await api.post(`/proposals/${proposalId}/accept`, { action: 'accept', message });
    return res.data.data.proposal;
  },

  // Client: Reject a proposal
  rejectProposal: async (proposalId: string, message?: string): Promise<Proposal> => {
    const res = await api.post(`/proposals/${proposalId}/reject`, { action: 'reject', message });
    return res.data.data.proposal;
  },

  // Provider: Withdraw own proposal
  withdrawProposal: async (proposalId: string): Promise<Proposal> => {
    const res = await api.post(`/proposals/${proposalId}/withdraw`);
    return res.data.data.proposal;
  },

  // Matching engine endpoints
  findMatchingProviders: async (jobId: string, options: { limit?: number; minRating?: number } = {}): Promise<MatchingResult> => {
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', String(options.limit));
    if (options.minRating) queryParams.append('minRating', String(options.minRating));
    const res = await api.get(`/proposals/job/${jobId}/match?${queryParams.toString()}`);
    return res.data.data;
  },

  autoMatchAndNotify: async (jobId: string, options: { limit?: number; minRating?: number } = {}): Promise<MatchingResult> => {
    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', String(options.limit));
    if (options.minRating) queryParams.append('minRating', String(options.minRating));
    const res = await api.post(`/proposals/job/${jobId}/auto-match?${queryParams.toString()}`);
    return res.data.data;
  },
};
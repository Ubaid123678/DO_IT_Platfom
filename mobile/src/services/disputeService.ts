import { api } from './api';

export type DisputeStatus = 'open' | 'evidence_submitted' | 'under_review' | 'resolved' | 'closed';
export type DisputeRaisedBy = 'client' | 'provider';
export type DisputeVerdict = 'client_wins' | 'provider_wins' | 'split';
export type DisputeResolution = 'escrow_to_client' | 'escrow_to_provider' | 'escrow_split' | 'escrow_refunded';
export type EvidenceType = 'document' | 'image' | 'video' | 'text' | 'link';

export interface IEvidence {
  _id?: string;
  type: EvidenceType;
  url?: string;
  content?: string;
  description?: string;
  submittedBy: string;
  submittedAt: string;
}

export interface IVerdict {
  verdict: 'client_wins' | 'provider_wins' | 'split';
  resolution: 'escrow_to_client' | 'escrow_to_provider' | 'escrow_split' | 'escrow_refunded';
  decidedBy: string;
  decidedAt: string;
  reasoning?: string;
  splitPercentage?: number;
}

export interface IDispute {
  _id: string;
  jobId: string;
  proposalId: string;
  raisedBy: DisputeRaisedBy;
  raisedByUserId: string;
  againstUserId: string;
  reason: string;
  description?: string;
  status: DisputeStatus;
  evidence: IEvidence[];
  verdict?: IVerdict;
  openedAt: string;
  evidenceDeadline: string;
  resolvedAt?: string;
  closedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDisputeStats {
  open: number;
  evidence_submitted: number;
  under_review: number;
  resolved: number;
  closed: number;
}

export interface CreateDisputePayload {
  jobId: string;
  proposalId: string;
  reason: string;
  description?: string;
}

export interface SubmitEvidencePayload {
  evidence: {
    type: EvidenceType;
    url?: string;
    content?: string;
    description?: string;
  }[];
}

export interface ResolveDisputePayload {
  verdict: 'client_wins' | 'provider_wins' | 'split';
  resolution: 'escrow_to_client' | 'escrow_to_provider' | 'escrow_split' | 'escrow_refunded';
  reasoning?: string;
  splitPercentage?: number;
  adminNotes?: string;
}

export interface ExtendDeadlinePayload {
  days: number;
}

export interface DisputeListParams {
  status?: DisputeStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'openedAt' | 'evidenceDeadline';
  sortOrder?: 'asc' | 'desc';
}

export interface DisputeListResponse {
  disputes: IDispute[];
  total: number;
  limit: number;
  skip: number;
}

export interface AdminDisputeListParams {
  status?: DisputeStatus;
  page?: number;
  limit?: number;
}

export interface AdminDisputeListResponse {
  disputes: IDispute[];
  total: number;
  limit: number;
  skip: number;
}

export const disputeService = {
  // Create a new dispute
  createDispute: async (payload: CreateDisputePayload): Promise<IDispute> => {
    const res = await api.post('/disputes', payload);
    return res.data.data.dispute;
  },

  // Get single dispute by ID
  getDisputeById: async (disputeId: string): Promise<IDispute> => {
    const res = await api.get(`/disputes/${disputeId}`);
    return res.data.data.dispute;
  },

  // Submit evidence for a dispute
  submitEvidence: async (disputeId: string, payload: SubmitEvidencePayload): Promise<IDispute> => {
    const res = await api.post(`/disputes/${disputeId}/evidence`, payload);
    return res.data.data.dispute;
  },

  // Add single evidence item
  addEvidence: async (disputeId: string, evidence: {
    type: EvidenceType;
    url?: string;
    content?: string;
    description?: string;
  }): Promise<IDispute> => {
    const res = await api.post(`/disputes/${disputeId}/evidence/add`, { evidence });
    return res.data.data.dispute;
  },

  // Get my disputes (as client or provider)
  getMyDisputes: async (params: {
    status?: 'open' | 'evidence_submitted' | 'under_review' | 'resolved' | 'closed' | 'all';
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'openedAt' | 'evidenceDeadline';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<DisputeListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/disputes?${queryParams.toString()}`);
    return res.data.data;
  },

  // Get dispute statistics for current user
  getDisputeStats: async (): Promise<{ open: number; evidence_submitted: number; under_review: number; resolved: number; closed: number }> => {
    const res = await api.get('/disputes/stats');
    return res.data.data.stats;
  },

  // Admin endpoints
  getDisputesForAdmin: async (params: {
    status?: 'open' | 'evidence_submitted' | 'under_review' | 'resolved' | 'closed' | 'all';
    page?: number;
    limit?: number;
  } = {}): Promise<AdminDisputeListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const res = await api.get(`/disputes/admin?${queryParams.toString()}`);
    return res.data.data;
  },

  getDisputeByIdForAdmin: async (disputeId: string) => {
    const res = await api.get(`/disputes/admin/${disputeId}`);
    return res.data.data.dispute;
  },

  // Admin: Resolve a dispute
  resolveDispute: async (disputeId: string, payload: {
    verdict: 'client_wins' | 'provider_wins' | 'split';
    resolution: 'escrow_to_client' | 'escrow_to_provider' | 'escrow_split' | 'escrow_refunded';
    reasoning?: string;
    splitPercentage?: number;
    adminNotes?: string;
  }): Promise<IDispute> => {
    const res = await api.post(`/disputes/${disputeId}/resolve`, payload);
    return res.data.data.dispute;
  },

  // Admin: Extend evidence deadline
  extendEvidenceDeadline: async (disputeId: string, days: number): Promise<IDispute> => {
    const res = await api.post(`/disputes/${disputeId}/extend-deadline`, { days });
    return res.data.data.dispute;
  },

  // Get dispute by ID for admin
  getDisputeByIdForAdmin: async (disputeId: string) => {
    const res = await api.get(`/disputes/admin/${disputeId}`);
    return res.data.data.dispute;
  },
};
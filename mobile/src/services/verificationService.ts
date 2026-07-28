import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';

const VERIF_COMPLETE_KEY = '@doit_verification_complete';

export interface SkillCategory {
  id: string;
  name: string;
  job_type: 'physical' | 'digital';
  icon_url?: string;
  active: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  requires_certificate: boolean;
}

export interface VerificationRecord {
  id: string;
  category_id: string;
  category?: string;
  skill_item_id: string;
  skill_item?: string;
  evidence_type: string;
  status: 'draft' | 'pending_review' | 'scheduled' | 'auto_approved' | 'approved' | 'rejected' | 'expired';
  sla_due_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface VerificationStatus {
  overall_status: 'incomplete' | 'pending' | 'partially_verified' | 'verified' | 'rejected';
  categories: {
    category_id: string;
    category_name: string;
    status: string;
  }[];
  has_pending: boolean;
  has_rejected: boolean;
  all_verified: boolean;
}

export interface ConnectedAccount {
  id: string;
  platform: 'github' | 'upwork' | 'linkedin';
  username: string;
  platform_user_id: string | null;
  verified: boolean;
  verified_at: string | null;
  connected_at: string;
}

export interface OAuthConnectResult {
  platform: string;
  username: string;
  verified: boolean;
  verification_score: number;
  platform_data: Record<string, unknown> | null;
  repo_analysis?: { match_count: number; matched_repos: string[]; languages: string[] };
}

export interface ResumeBioData {
  headline: string;
  bio: string;
  years_experience: number;
  languages: string[];
  work_history: { title: string; company: string; start_date: string; end_date?: string; description: string }[];
  education: { degree: string; institution: string; field?: string; start_year?: number; end_year?: number }[];
}

export const verificationService = {
  getCategories: async (): Promise<SkillCategory[]> => {
    const res = await api.get('/providers/categories');
    return res.data.data.categories;
  },

  getSkillItems: async (categoryId: string): Promise<SkillItem[]> => {
    const res = await api.get(`/providers/categories/${categoryId}/skill-items`);
    return res.data.data.skill_items;
  },

  selectCategories: async (categoryIds: string[], skillItemIds: string[]): Promise<void> => {
    await api.post('/providers/categories', { categories: categoryIds, skill_items: skillItemIds });
  },

  getSelectedCategories: async (): Promise<{ categories: { id: string; name: string; job_type: string }[] }> => {
    const res = await api.get('/providers/categories');
    return res.data.data;
  },

  submitEvidence: async (evidence: {
    category_id: string;
    skill_item_id: string;
    evidence_type: string;
    evidence_payload: Record<string, unknown>;
  }): Promise<VerificationRecord> => {
    const res = await api.post('/providers/verification-records', evidence);
    return res.data.data.record;
  },

  getVerificationRecords: async (): Promise<VerificationRecord[]> => {
    const res = await api.get('/providers/verification-records');
    return res.data.data.records;
  },

  getVerificationRecordDetail: async (id: string): Promise<VerificationRecord> => {
    const res = await api.get(`/providers/verification-records/${id}`);
    return res.data.data;
  },

  resubmitEvidence: async (id: string, evidence: {
    evidence_type: string;
    evidence_payload: Record<string, unknown>;
  }): Promise<VerificationRecord> => {
    const res = await api.post(`/providers/verification-records/${id}/resubmit`, evidence);
    return res.data.data.record;
  },

  uploadResume: async (fileUri: string): Promise<{ parse_result_id: string }> => {
    const formData = new FormData();
    formData.append('resume', { uri: fileUri, name: 'resume.pdf', type: 'application/pdf' } as any);
    const res = await api.post('/providers/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  getParseResult: async (id: string): Promise<Record<string, unknown>> => {
    const res = await api.get(`/providers/resume/parse-result/${id}`);
    return res.data.data;
  },

  updateProfile: async (data: Partial<ResumeBioData>): Promise<void> => {
    await api.patch('/providers/profile', data);
  },

  getProfile: async (): Promise<ResumeBioData> => {
    const res = await api.get('/providers/profile');
    return res.data.data;
  },

  getVerificationStatus: async (): Promise<VerificationStatus> => {
    const res = await api.get('/providers/verification-status');
    return res.data.data;
  },

  connectGithub: async (username: string, skillKeywords?: string[]): Promise<OAuthConnectResult> => {
    const res = await api.post('/providers/oauth/github/connect', { username, skill_keywords: skillKeywords });
    return res.data.data;
  },

  getConnectedAccounts: async (): Promise<ConnectedAccount[]> => {
    const res = await api.get('/providers/oauth/accounts');
    return res.data.data.accounts;
  },

  submitEvidenceWithAutoVerify: async (evidence: {
    category_id: string;
    skill_item_id: string;
    evidence_type: string;
    evidence_payload: Record<string, unknown>;
  }): Promise<VerificationRecord> => {
    const res = await api.post('/providers/verification-records/auto-verify', evidence);
    return res.data.data.record;
  },

  markVerificationComplete: async (): Promise<void> => {
    await AsyncStorage.setItem(VERIF_COMPLETE_KEY, 'true');
  },

  isVerificationComplete: async (): Promise<boolean> => {
    const val = await AsyncStorage.getItem(VERIF_COMPLETE_KEY);
    return val === 'true';
  },

  clearVerificationComplete: async (): Promise<void> => {
    await AsyncStorage.removeItem(VERIF_COMPLETE_KEY);
  },
};

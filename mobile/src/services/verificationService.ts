import api from './api';

export interface SkillCategory {
  _id: string;
  name: string;
  job_type: 'physical' | 'digital';
  icon_url: string;
  active: boolean;
}

export interface SkillItem {
  _id: string;
  category_id: string;
  name: string;
  requires_certificate: boolean;
  supports_auto_test: boolean;
}

export interface VerificationRecord {
  _id: string;
  provider_id: string;
  category_id: string;
  skill_item_id: string;
  verification_track: 'physical' | 'digital';
  evidence_type: string;
  evidence_payload: Record<string, unknown>;
  status: 'draft' | 'pending_review' | 'scheduled' | 'auto_approved' | 'approved' | 'rejected' | 'expired';
  auto_check_result?: Record<string, unknown>;
  sla_due_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeParseResult {
  _id: string;
  source_file_url: string;
  parsed_fields: Record<string, unknown>;
  confidence_score: number;
  applied: boolean;
}

export interface ProviderSelection {
  categories: string[];
  skill_items: string[];
}

export interface EvidenceSubmission {
  category_id: string;
  skill_item_id: string;
  evidence_type: string;
  evidence_payload: Record<string, unknown>;
}

export interface VerificationStatus {
  overall_status: 'incomplete' | 'pending' | 'partially_verified' | 'verified' | 'rejected';
  categories: {
    category_id: string;
    category_name: string;
    status: string;
    skill_items: { skill_item_id: string; name: string; status: string; rejection_reason?: string }[];
  }[];
}

export interface ResumeBioData {
  headline: string;
  bio: string;
  years_experience: number;
  languages: string[];
  work_history: { title: string; company: string; start_date: string; end_date?: string; description: string }[];
  education: { degree: string; institution: string; year: number }[];
}

export const verificationService = {
  // Categories & Skills
  getCategories: async (): Promise<SkillCategory[]> => {
    const res = await api.get('/api/v1/providers/categories');
    return res.data.data;
  },

  getSkillItems: async (categoryId: string): Promise<SkillItem[]> => {
    const res = await api.get(`/api/v1/providers/categories/${categoryId}/skill-items`);
    return res.data.data;
  },

  selectCategories: async (selection: ProviderSelection): Promise<void> => {
    await api.post('/api/v1/providers/categories', selection);
  },

  getSelectedCategories: async (): Promise<ProviderSelection> => {
    const res = await api.get('/api/v1/providers/categories');
    return res.data.data;
  },

  // Verification Records
  submitEvidence: async (evidence: EvidenceSubmission): Promise<VerificationRecord> => {
    const res = await api.post('/api/v1/providers/verification-records', evidence);
    return res.data.data;
  },

  getVerificationRecords: async (): Promise<VerificationRecord[]> => {
    const res = await api.get('/api/v1/providers/verification-records');
    return res.data.data;
  },

  getVerificationRecordDetail: async (id: string): Promise<VerificationRecord> => {
    const res = await api.get(`/api/v1/providers/verification-records/${id}`);
    return res.data.data;
  },

  resubmitEvidence: async (id: string, payload: Record<string, unknown>): Promise<VerificationRecord> => {
    const res = await api.post(`/api/v1/providers/verification-records/${id}/resubmit`, payload);
    return res.data.data;
  },

  // Resume / Bio
  uploadResume: async (fileUri: string): Promise<{ parse_result_id: string }> => {
    const formData = new FormData();
    formData.append('resume', { uri: fileUri, name: 'resume.pdf', type: 'application/pdf' } as any);
    const res = await api.post('/api/v1/providers/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  getParseResult: async (id: string): Promise<ResumeParseResult> => {
    const res = await api.get(`/api/v1/providers/resume/parse-result/${id}`);
    return res.data.data;
  },

  updateProfile: async (data: ResumeBioData): Promise<void> => {
    await api.patch('/api/v1/providers/profile', data);
  },

  getProfile: async (): Promise<ResumeBioData> => {
    const res = await api.get('/api/v1/providers/profile');
    return res.data.data;
  },

  // Status
  getVerificationStatus: async (): Promise<VerificationStatus> => {
    const res = await api.get('/api/v1/providers/verification-status');
    return res.data.data;
  },

  // Skills Test
  startSkillTest: async (skillItemId: string): Promise<{ attempt_id: string; time_limit_seconds: number }> => {
    const res = await api.post(`/api/v1/providers/skill-tests/${skillItemId}/start`);
    return res.data.data;
  },

  submitSkillTest: async (attemptId: string, answers: { question_id: string; answer: string }[]): Promise<{ score: number; passed: boolean }> => {
    const res = await api.post(`/api/v1/providers/skill-tests/${attemptId}/submit`, { answers });
    return res.data.data;
  },

  // OAuth
  connectGithub: async (): Promise<{ auth_url: string }> => {
    const res = await api.post('/api/v1/providers/oauth/github/connect');
    return res.data.data;
  },
};

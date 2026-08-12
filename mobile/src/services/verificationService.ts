import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { api } from './api';

const VERIF_COMPLETE_KEY = '@doit_verification_complete';

let categoriesCache: SkillCategory[] | null = null;
const skillItemsCache: Record<string, SkillItem[]> = {};

export interface SkillCategory {
  id: string;
  name: string;
  job_type: 'physical' | 'digital' | 'errand';
  icon_url?: string;
  active: boolean;
}

export interface SkillItem {
  id: string;
  name: string;
  requires_certificate: boolean;
  requires_vehicle: boolean;
}

export interface VerificationRecord {
  id: string;
  category_id: string;
  category?: string;
  category_job_type?: string | null;
  skill_item_id: string | null;
  skill_item?: string | null;
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
    job_type?: string | null;
    status: string;
    rejection_reason?: string | null;
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
  repo_analysis?: {
    match_count: number;
    matched_repos: string[];
    languages: string[];
    languages_by_bytes?: string[];
    excluded_repos?: number;
  };
}

export interface ResumeBioData {
  headline: string;
  bio: string;
  years_experience: number;
  languages: string[];
  work_history: { title: string; company: string; start_date: string; end_date?: string; description: string }[];
  education: { degree: string; institution: string; field?: string; start_year?: number; end_year?: number }[];
}

export type ProviderTrack = 'physical' | 'digital' | 'errand';
export type LanguageLevel = 'basic' | 'intermediate' | 'fluent';

export interface LanguageItem {
  code: string;
  level: LanguageLevel;
}

export interface AvailabilityWindow {
  days: string[];
  shifts: string[];
  hours_per_week: number;
}

export interface ProviderProfileData {
  avatar_url?: string;
  headline?: string;
  bio?: string;
  languages?: LanguageItem[];
  city?: string;
  availability?: AvailabilityWindow;
  public_profile?: boolean;
}

export interface PhysicalTrackData {
  years_experience?: number;
  service_radius_km?: number;
  tools_equipment?: string[];
  hourly_rate?: number;
  on_site_availability?: AvailabilityWindow;
  can_travel?: boolean;
  team_size?: 'solo' | 'with_helper' | 'with_team';
  insurance?: { covered: boolean; doc_uri?: string };
  has_transport?: { yes: boolean; mode?: 'bicycle' | 'motorbike' | 'car' };
}

export interface DigitalTrackData {
  skills?: string[];
  tech_stack?: string[];
  hourly_rate?: number;
  project_rate?: number;
  timezone?: string;
  english_proficiency?: LanguageLevel;
  work_history?: { title: string; company: string; start_date: string; end_date?: string; description?: string }[];
  education?: { institution: string; degree: string; field?: string; start_year?: number; end_year?: number }[];
  resume_file_url?: string;
}

export interface ErrandTrackData {
  service_area?: { city: string; radius_km: number };
  transport_mode?: 'on_foot' | 'bicycle' | 'motorbike' | 'car' | 'van';
  base_fee?: number;
  per_km_fee?: number;
  working_hours?: AvailabilityWindow;
  same_day_express?: boolean;
  delivery_capabilities?: string[];
  max_payload_kg?: number;
  max_package_size?: string;
  goods_insurance?: { covered: boolean; doc_uri?: string };
}

export interface TrackData {
  physical?: PhysicalTrackData;
  digital?: DigitalTrackData;
  errand?: ErrandTrackData;
}

export interface ProviderProfileResponse {
  provider_profile: ProviderProfileData;
  track: ProviderTrack | null;
  track_data: TrackData;
  completeness: number;
  missing_fields: string[];
}

export interface PublicProviderProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  languages: LanguageItem[];
  city: string | null;
  track: ProviderTrack | null;
  overall_status: string;
  categories: { id: string; name: string; job_type: string }[];
  track_data: TrackData;
}

export const verificationService = {
  getCategories: async (): Promise<SkillCategory[]> => {
    if (categoriesCache) return categoriesCache;
    const res = await api.get('/providers/categories');
    const cats = res.data.data.categories;
    categoriesCache = cats;
    return cats;
  },

  getSkillItems: async (categoryId: string): Promise<SkillItem[]> => {
    if (skillItemsCache[categoryId]) return skillItemsCache[categoryId];
    const res = await api.get(`/providers/categories/${categoryId}/skill-items`);
    const items = res.data.data.skill_items;
    skillItemsCache[categoryId] = items;
    return items;
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

  uploadResume: async (fileUri: string): Promise<{ resume_file_url: string; parse_result_id: string }> => {
    const formData = new FormData();
    formData.append('resume', { uri: fileUri, name: 'resume.pdf', type: 'application/pdf' } as any);
    const res = await api.post('/providers/resume/upload', formData, { timeout: 60000 });
    return res.data.data;
  },

  uploadAvatar: async (fileUri: string, mimeType: string): Promise<ProviderProfileResponse> => {
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${base64}`;
    const res = await api.post('/providers/profile/avatar', { data: dataUrl }, { timeout: 60000 });
    return res.data.data;
  },

  getParseResult: async (id: string): Promise<Record<string, unknown>> => {
    const res = await api.get(`/providers/resume/parse-result/${id}`);
    return res.data.data;
  },

  updateProfile: async (data: {
    provider_profile?: Partial<ProviderProfileData>;
    track_data?: TrackData;
  }): Promise<ProviderProfileResponse> => {
    const res = await api.patch('/providers/profile', data);
    return res.data.data;
  },

  getProfile: async (): Promise<ProviderProfileResponse> => {
    const res = await api.get('/providers/profile');
    return res.data.data;
  },

  getPublicProfile: async (providerId: string): Promise<PublicProviderProfile> => {
    const res = await api.get(`/providers/${providerId}/public`);
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

  verifyPortfolioUrl: async (url: string): Promise<{ valid: boolean; status_code: number; content_length: number }> => {
    const res = await api.post('/providers/portfolio/verify', { url });
    return res.data.data;
  },

  submitAllEvidence: async (evidenceBatch: {
    category_id: string;
    skill_item_id?: string;
    evidence_type: string;
    evidence_payload: Record<string, unknown>;
  }[]): Promise<VerificationRecord[]> => {
    const res = await api.post('/providers/verification-records/submit-batch', { evidence_batch: evidenceBatch });
    return res.data.data.records;
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

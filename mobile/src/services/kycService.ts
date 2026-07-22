import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from './api';

export type KycStatus = 'missing' | 'pending' | 'approved' | 'rejected';
export type KycDocumentType = 'id_card' | 'passport' | 'driver_license' | 'business_license' | 'proof_of_address' | 'other';
export type StorageProvider = 'mock' | 's3' | 'r2';

export type KycDocument = {
  id: string;
  userId: string;
  userRole: 'pending' | 'client' | 'provider' | 'admin';
  status: KycStatus;
  documentType: KycDocumentType;
  storageProvider: StorageProvider;
  storageKey: string;
  storageUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  countryCode: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type KycStatusResponse = {
  user: {
    id: string;
    role: 'pending' | 'client' | 'provider' | 'admin';
    fullName: string;
    email: string;
  };
  status: KycStatus;
  canAccessRestrictedActions: boolean;
  latestDocument: KycDocument | null;
};

export type KycRestrictedAccessResponse = {
  accessGranted: boolean;
  status: KycStatus;
  reason: string;
  latestDocument: KycDocument | null;
};

export type KycUploadUrlPayload = {
  documentType: KycDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageProvider?: StorageProvider;
  countryCode: string;
};

export type KycSubmissionPayload = KycUploadUrlPayload & {
  storageKey: string;
  storageUrl: string;
  notes?: string;
};

export type KycUploadUrlResponse = {
  storageProvider: StorageProvider;
  storageKey: string;
  uploadUrl: string;
  expiresAt: string;
  documentType: KycDocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  countryCode: string;
};

const authHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await AsyncStorage.getItem('accessToken');

  if (!accessToken) {
    throw new Error('Access token is missing. Please sign in again.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
};

const unwrap = <T>(response: { data: ApiEnvelope<T> }): T => response.data.data;

export const kycService = {
  getProviderStatus: async (): Promise<KycStatusResponse> => {
    const response = await api.get<ApiEnvelope<KycStatusResponse>>('/kyc/provider/status', {
      headers: await authHeaders(),
    });

    return unwrap(response);
  },

  getRestrictedAccess: async (): Promise<KycRestrictedAccessResponse> => {
    const response = await api.get<ApiEnvelope<KycRestrictedAccessResponse>>('/kyc/provider/restricted-access', {
      headers: await authHeaders(),
    });

    return unwrap(response);
  },

  createUploadUrl: async (payload: KycUploadUrlPayload): Promise<KycUploadUrlResponse> => {
    const response = await api.post<ApiEnvelope<KycUploadUrlResponse>>('/kyc/provider/upload-url', payload, {
      headers: await authHeaders(),
    });

    return unwrap(response);
  },

  submitKyc: async (payload: KycSubmissionPayload): Promise<KycDocument> => {
    const response = await api.post<ApiEnvelope<{ document: KycDocument }>>('/kyc/provider/submit', payload, {
      headers: await authHeaders(),
    });

    return response.data.data.document;
  },

  resubmitKyc: async (payload: KycSubmissionPayload): Promise<KycDocument> => {
    const response = await api.post<ApiEnvelope<{ document: KycDocument }>>('/kyc/provider/resubmit', payload, {
      headers: await authHeaders(),
    });

    return response.data.data.document;
  },
};

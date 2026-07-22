import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { api } from './api';

export type KycStatus = 'missing' | 'pending' | 'approved' | 'rejected';
export type KycDocumentType = 'pass' | 'driving_license' | 'passport';

export type KycDocument = {
  id: string;
  userId: string;
  userRole: string;
  status: KycStatus;
  documentType: KycDocumentType;
  countryCode: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KycImageType = 'document_front' | 'document_back' | 'face_clear' | 'move_left' | 'move_right' | 'smile';

export type KycUploadImageResponse = {
  imageId: string;
};

export type KycSubmissionPayload = {
  documentType: KycDocumentType;
  documentImageIds: {
    front: string;
    back?: string;
  };
  livenessImageIds: {
    face_clear: string;
    move_left: string;
    move_right: string;
    smile: string;
  };
  countryCode: string;
  notes?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type KycStatusResponse = {
  user: {
    id: string;
    role: string;
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

const authHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  if (!accessToken) throw new Error('Access token is missing. Please sign in again.');
  return { Authorization: `Bearer ${accessToken}` };
};

export const kycService = {
  getProviderStatus: async (): Promise<KycStatusResponse> => {
    const response = await api.get<ApiEnvelope<KycStatusResponse>>('/kyc/provider/status', {
      headers: await authHeaders(),
    });
    return response.data.data;
  },

  getRestrictedAccess: async (): Promise<KycRestrictedAccessResponse> => {
    const response = await api.get<ApiEnvelope<KycRestrictedAccessResponse>>('/kyc/provider/restricted-access', {
      headers: await authHeaders(),
    });
    return response.data.data;
  },

  uploadImage: async (imageType: KycImageType, fileUri: string): Promise<KycUploadImageResponse> => {
    const formData = new FormData();
    formData.append('image', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as unknown as Blob);
    formData.append('imageType', imageType);

    const accessToken = await AsyncStorage.getItem('accessToken');
    const baseUrl = api.defaults.baseURL;
    const response = await axios.post<ApiEnvelope<KycUploadImageResponse>>(
      `${baseUrl}/kyc/provider/upload-image`,
      formData,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 60000,
      },
    );
    return response.data.data;
  },

  submitKyc: async (payload: KycSubmissionPayload): Promise<KycDocument> => {
    const response = await api.post<ApiEnvelope<{ document: KycDocument }>>('/kyc/provider/submit', payload, {
      headers: await authHeaders(),
      timeout: 60000,
    });
    return response.data.data.document;
  },

  resubmitKyc: async (payload: KycSubmissionPayload): Promise<KycDocument> => {
    const response = await api.post<ApiEnvelope<{ document: KycDocument }>>('/kyc/provider/resubmit', payload, {
      headers: await authHeaders(),
      timeout: 60000,
    });
    return response.data.data.document;
  },
};

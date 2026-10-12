import type {
  KycUserStatus,
  ProviderTrack,
  UserOverallStatus,
  UserRole,
} from '../auth/auth.model.js';
import type { VerificationStatus } from '../verification/verification.model.js';

export type AdminUserSortField =
  'createdAt' | 'updatedAt' | 'fullName' | 'email';
export type AdminSortOrder = 'asc' | 'desc';

export interface AdminUserListQuery {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  email_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: KycUserStatus;
  overall_status?: UserOverallStatus;
  track?: ProviderTrack;
  sort_by: AdminUserSortField;
  sort_order: AdminSortOrder;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  headline?: string;
  overall_status: UserOverallStatus;
  track?: ProviderTrack;
  kyc_status: KycUserStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserListResult {
  users: AdminUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserUpdateInput {
  role?: UserRole;
  isActive?: boolean;
  reason?: string;
}

export type AdminVerificationCounts = Record<VerificationStatus, number> & {
  total: number;
};

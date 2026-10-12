export type AdminUserRole = "client" | "provider" | "admin" | "pending";
export type AdminKycStatus = "approved" | "pending" | "rejected" | "missing";
export type AdminOverallStatus =
  | "incomplete"
  | "pending"
  | "partially_verified"
  | "verified"
  | "rejected";
export type AdminTrack = "physical" | "digital" | "errand";
export type AdminUserSortField =
  | "createdAt"
  | "updatedAt"
  | "fullName"
  | "email";
export type AdminSortOrder = "asc" | "desc";

export interface AdminUsersQuery {
  page: number;
  limit: number;
  search?: string;
  role?: AdminUserRole;
  email_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: AdminKycStatus;
  overall_status?: AdminOverallStatus;
  track?: AdminTrack;
  sort_by: AdminUserSortField;
  sort_order: AdminSortOrder;
}

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  headline?: string;
  overall_status: AdminOverallStatus;
  track?: AdminTrack;
  kyc_status: AdminKycStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: AdminUsersPagination;
}

export interface AdminUserWorkHistoryItem {
  title?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  [field: string]: unknown;
}

export interface AdminUserEducationItem {
  institution?: string;
  degree?: string;
  field?: string;
  start_year?: number;
  end_year?: number;
  [field: string]: unknown;
}

export interface AdminUserDetail extends AdminUserListItem {
  avatar_url?: string;
  categories_selected: string[];
  skill_items_selected: string[];
  provider_profile: Record<string, unknown>;
  bio?: string;
  languages: string[];
  work_history: AdminUserWorkHistoryItem[];
  education: AdminUserEducationItem[];
  public_profile: boolean;
}

export type AdminVerificationStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "auto_approved"
  | "approved"
  | "rejected"
  | "expired";

export interface AdminVerificationCounts {
  draft: number;
  pending_review: number;
  scheduled: number;
  auto_approved: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
}

export interface AdminUserDetailResponse {
  user: AdminUserDetail;
  verification_counts: AdminVerificationCounts;
}

export interface AdminDashboardActivity {
  admin: {
    id: string;
    fullName: string;
  };
  action: string;
  target?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  created_at: string;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    clients: number;
    providers: number;
    newLast7Days: number;
  };
  kyc: {
    pending: number;
    approved: number;
    rejected: number;
  };
  verification: {
    pending_review: number;
    slaOverdue: number;
    approvedToday: number;
    rejectedToday: number;
  };
  recentActivity: AdminDashboardActivity[];
}

export type KycStatus = "pending" | "approved" | "rejected";

export type KycDocumentType = "pass" | "passport" | "driving_license";

export interface KycSubmission {
  id: string;
  userId: string;
  status: KycStatus;
  documentType: KycDocumentType | string;
  countryCode: string;
  submittedAt: string;
  rejectionReason?: string | null;
  user: {
    fullName: string;
    email: string;
  };
}

export interface KycPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface KycSubmissionsResponse {
  submissions: KycSubmission[];
  pagination: KycPagination;
}

export interface KycSubmissionDetail extends Omit<KycSubmission, "user"> {
  documentImages: {
    front?: string | null;
    back?: string | null;
  };
  livenessImages: {
    face_clear?: string | null;
    move_left?: string | null;
    move_right?: string | null;
    smile?: string | null;
  };
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

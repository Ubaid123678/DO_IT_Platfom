export type Track = "physical" | "digital" | "errand";

export interface ProviderProfileResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    countryCode: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    overall_status: string;
    createdAt: string;
  };
  categories: { id: string; name: string; job_type: string }[];
  provider_profile: {
    avatar_url?: string | null;
    headline?: string | null;
    bio?: string | null;
    languages?: { code: string; level: string }[];
    city?: string | null;
    availability?: { days: string[]; shifts: string[]; hours_per_week: number } | null;
    public_profile?: boolean;
  };
  track: Track;
  track_data: Partial<Record<Track, Record<string, unknown>>>;
  completeness: number;
  missing_fields: string[];
}

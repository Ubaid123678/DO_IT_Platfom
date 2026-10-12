import mongoose, { type Document, type Model, Schema } from 'mongoose';

export type UserRole = 'pending' | 'client' | 'provider' | 'admin';
export type KycUserStatus = 'approved' | 'pending' | 'rejected' | 'missing';
export type UserOverallStatus =
  'incomplete' | 'pending' | 'partially_verified' | 'verified' | 'rejected';

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

export interface ProviderProfile {
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
  work_history?: {
    title: string;
    company: string;
    start_date: string;
    end_date?: string;
    description?: string;
  }[];
  education?: {
    institution: string;
    degree: string;
    field?: string;
    start_year?: number;
    end_year?: number;
  }[];
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

type OtpState = {
  code: string;
  expiresAt: Date;
  attempts: number;
};

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  kyc_status: KycUserStatus;
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  avatar_url?: string;
  client_profile?: {
    bio?: string;
    city?: string;
    languages?: LanguageItem[];
    notificationEmail?: boolean;
    notificationPush?: boolean;
    notificationSms?: boolean;
    profileVisibility?: 'public' | 'private';
  };
  tokenVersion: number;
  failedLoginAttempts: number;
  lockUntil?: Date;
  emailOtp?: OtpState;
  phoneOtp?: OtpState;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  categories_selected?: string[];
  skill_items_selected?: string[];
  overall_status?: UserOverallStatus;
  headline?: string;
  bio?: string;
  years_experience?: number;
  languages?: string[];
  work_history?: {
    title: string;
    company: string;
    start_date: string;
    end_date?: string;
    description?: string;
  }[];
  education?: {
    institution: string;
    degree: string;
    field?: string;
    start_year?: number;
    end_year?: number;
  }[];
  resume_file_url?: string;
  resume_parsed_at?: Date;
  public_profile?: boolean;
  track?: ProviderTrack;
  provider_profile?: ProviderProfile;
  track_data?: TrackData;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<OtpState>(
  {
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['pending', 'client', 'provider', 'admin'],
      default: 'pending',
      required: true,
      index: true,
    },
    kyc_status: {
      type: String,
      enum: ['approved', 'pending', 'rejected', 'missing'],
      default: 'missing',
      index: true,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 3,
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, required: false, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    avatar_url: { type: String, required: false },
    client_profile: { type: Schema.Types.Mixed, required: false, default: {} },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, required: false },
    emailOtp: { type: otpSchema, required: false },
    phoneOtp: { type: otpSchema, required: false },
    passwordResetToken: { type: String, required: false, index: true },
    passwordResetExpiresAt: { type: Date, required: false },
    categories_selected: { type: [String], required: false },
    skill_items_selected: { type: [String], required: false },
    overall_status: {
      type: String,
      enum: [
        'incomplete',
        'pending',
        'partially_verified',
        'verified',
        'rejected',
      ],
      default: 'incomplete',
    },
    headline: { type: String, required: false, maxlength: 200 },
    bio: { type: String, required: false, maxlength: 500 },
    years_experience: { type: Number, required: false, min: 0, max: 100 },
    languages: { type: [String], required: false },
    work_history: { type: [Schema.Types.Mixed], required: false },
    education: { type: [Schema.Types.Mixed], required: false },
    resume_file_url: { type: String, required: false },
    resume_parsed_at: { type: Date, required: false },
    public_profile: { type: Boolean, default: false },
    track: {
      type: String,
      enum: ['physical', 'digital', 'errand'],
      required: false,
      index: true,
    },
    provider_profile: {
      type: Schema.Types.Mixed,
      required: false,
      default: {},
    },
    track_data: { type: Schema.Types.Mixed, required: false, default: {} },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ kyc_status: 1, createdAt: -1 });
userSchema.index({ overall_status: 1, createdAt: -1 });
userSchema.index({ track: 1, createdAt: -1 });
userSchema.index({ emailVerified: 1, phoneVerified: 1, createdAt: -1 });
userSchema.index({ createdAt: -1 });

// Client profile is "complete" when the fields a client must provide are filled.
// Derived at read time so it can never drift from the real data (no sentinel).
const isClientProfileComplete = (profile: Record<string, any> | undefined): boolean => {
  if (!profile) return false;
  const hasName = typeof profile.fullName === 'string' && profile.fullName.trim().length >= 2;
  const hasCity = typeof profile.city === 'string' && profile.city.trim().length > 0;
  const hasBio = typeof profile.bio === 'string' && profile.bio.trim().length > 0;
  const hasLanguages = Array.isArray(profile.languages) && profile.languages.length > 0;
  return Boolean(hasName && hasCity && hasBio && hasLanguages);
};

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.emailOtp;
    delete ret.phoneOtp;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpiresAt;
    // Derive per-role completion flags used by the mobile gates. Always emit
    // client_profile so clients created before the field existed still get it.
    const clientProfile = (ret.client_profile as Record<string, any> | undefined) ?? {};
    ret.client_profile = {
      ...clientProfile,
      fullName: clientProfile.fullName ?? ret.fullName,
      completed: isClientProfileComplete({ ...clientProfile, fullName: clientProfile.fullName ?? ret.fullName }),
    };
    return ret;
  },
});

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default UserModel;

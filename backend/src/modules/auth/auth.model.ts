import mongoose, { type Document, type Model, Schema } from 'mongoose';

export type UserRole = 'pending' | 'client' | 'provider' | 'admin';

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
  countryCode: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  tokenVersion: number;
  failedLoginAttempts: number;
  lockUntil?: Date;
  emailOtp?: OtpState;
  phoneOtp?: OtpState;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  categories_selected?: string[];
  skill_items_selected?: string[];
  overall_status?: string;
  headline?: string;
  bio?: string;
  years_experience?: number;
  languages?: string[];
  work_history?: { title: string; company: string; start_date: string; end_date?: string; description?: string }[];
  education?: { institution: string; degree: string; field?: string; start_year?: number; end_year?: number }[];
  resume_file_url?: string;
  resume_parsed_at?: Date;
  public_profile?: boolean;
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
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['pending', 'client', 'provider', 'admin'],
      default: 'pending',
      required: true,
      index: true,
    },
    countryCode: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 3 },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, required: false },
    emailOtp: { type: otpSchema, required: false },
    phoneOtp: { type: otpSchema, required: false },
    passwordResetToken: { type: String, required: false, index: true },
    passwordResetExpiresAt: { type: Date, required: false },
    categories_selected: { type: [String], required: false },
    skill_items_selected: { type: [String], required: false },
    overall_status: { type: String, enum: ['incomplete', 'pending', 'partially_verified', 'verified', 'rejected'], default: 'incomplete' },
    headline: { type: String, required: false, maxlength: 200 },
    bio: { type: String, required: false, maxlength: 500 },
    years_experience: { type: Number, required: false, min: 0, max: 100 },
    languages: { type: [String], required: false },
    work_history: { type: [Schema.Types.Mixed], required: false },
    education: { type: [Schema.Types.Mixed], required: false },
    resume_file_url: { type: String, required: false },
    resume_parsed_at: { type: Date, required: false },
    public_profile: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.emailOtp;
    delete ret.phoneOtp;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpiresAt;
    return ret;
  },
});

const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default UserModel;

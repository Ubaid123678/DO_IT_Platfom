import mongoose, { type Document, type Model, Schema } from 'mongoose';

export type UserRole = 'client' | 'provider' | 'admin';

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
      enum: ['client', 'provider', 'admin'],
      default: 'client',
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

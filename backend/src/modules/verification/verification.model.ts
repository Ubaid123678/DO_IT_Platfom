import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type JobType = 'physical' | 'digital';

export type VerificationTrack = 'physical' | 'digital';

export type EvidenceType = 'certificate' | 'prior_work' | 'portfolio' | 'oauth' | 'digital' | 'physical';

export type VerificationStatus = 'draft' | 'pending_review' | 'scheduled' | 'auto_approved' | 'approved' | 'rejected' | 'expired';

export type OverallStatus = 'incomplete' | 'pending' | 'partially_verified' | 'verified' | 'rejected';

export type AdminReviewAction = 'approved' | 'rejected' | 'requested_more_info' | 'escalated';

export interface ISkillCategory extends Document {
  name: string;
  job_type: JobType;
  icon_url?: string;
  active: boolean;
  risk_tier: 'low' | 'medium' | 'high';
  sla_hours: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISkillItem extends Document {
  category_id: mongoose.Types.ObjectId;
  name: string;
  requires_certificate: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerificationRecord extends Document {
  provider_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;
  skill_item_id?: mongoose.Types.ObjectId;
  verification_track: VerificationTrack;
  evidence_type: EvidenceType;
  evidence_payload: Record<string, unknown>;
  status: VerificationStatus;
  auto_check_result?: Record<string, unknown>;
  sla_due_at?: Date;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IAdminReview extends Document {
  verification_record_id: mongoose.Types.ObjectId;
  admin_id: mongoose.Types.ObjectId;
  action: AdminReviewAction;
  notes?: string;
  created_at: Date;
}

export interface IConnectedAccount extends Document {
  provider_id: mongoose.Types.ObjectId;
  platform: 'github' | 'upwork' | 'linkedin';
  username: string;
  access_token?: string;
  token_expires_at?: Date;
  platform_user_id?: string;
  platform_data?: Record<string, unknown>;
  verified: boolean;
  verified_at?: Date;
  connected_at: Date;
}

export interface IResumeParseResult extends Document {
  provider_id: mongoose.Types.ObjectId;
  source_file_url: string;
  parsed_fields?: Record<string, unknown>;
  confidence_score?: number;
  applied: boolean;
  created_at: Date;
}

const skillCategorySchema = new Schema<ISkillCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    job_type: { type: String, enum: ['physical', 'digital'], required: true, index: true },
    icon_url: { type: String, required: false },
    active: { type: Boolean, default: true, index: true },
    risk_tier: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    sla_hours: { type: Number, default: 48 },
  },
  { timestamps: true },
);

const skillItemSchema = new Schema<ISkillItem>(
  {
    category_id: { type: Schema.Types.ObjectId, ref: 'SkillCategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    requires_certificate: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

skillItemSchema.index({ category_id: 1, name: 1 }, { unique: true });

const verificationRecordSchema = new Schema<IVerificationRecord>(
  {
    provider_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'SkillCategory', required: true, index: true },
    skill_item_id: { type: Schema.Types.ObjectId, ref: 'SkillItem', required: false, index: true },
    verification_track: { type: String, enum: ['physical', 'digital'], required: true },
    evidence_type: {
      type: String,
      enum: ['certificate', 'prior_work', 'portfolio', 'oauth', 'digital', 'physical'],
      required: true,
    },
    evidence_payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'scheduled', 'auto_approved', 'approved', 'rejected', 'expired'],
      default: 'pending_review',
      required: true,
      index: true,
    },
    auto_check_result: { type: Schema.Types.Mixed, required: false },
    sla_due_at: { type: Date, required: false },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    reviewed_at: { type: Date, required: false },
    rejection_reason: { type: String, required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

verificationRecordSchema.index({ provider_id: 1, status: 1, created_at: -1 });
verificationRecordSchema.index({ category_id: 1, status: 1 });
verificationRecordSchema.index({ status: 1, sla_due_at: 1 });

const adminReviewSchema = new Schema<IAdminReview>(
  {
    verification_record_id: { type: Schema.Types.ObjectId, ref: 'VerificationRecord', required: true, index: true },
    admin_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'requested_more_info', 'escalated'],
      required: true,
    },
    notes: { type: String, required: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

const connectedAccountSchema = new Schema<IConnectedAccount>(
  {
    provider_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['github', 'upwork', 'linkedin'], required: true, index: true },
    username: { type: String, required: true, trim: true },
    access_token: { type: String, required: false },
    token_expires_at: { type: Date, required: false },
    platform_user_id: { type: String, required: false },
    platform_data: { type: Schema.Types.Mixed, required: false },
    verified: { type: Boolean, default: false },
    verified_at: { type: Date, required: false },
    connected_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'connected_at', updatedAt: false } },
);

connectedAccountSchema.index({ provider_id: 1, platform: 1 }, { unique: true });

const resumeParseResultSchema = new Schema<IResumeParseResult>(
  {
    provider_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source_file_url: { type: String, required: true },
    parsed_fields: { type: Schema.Types.Mixed, required: false },
    confidence_score: { type: Number, required: false, min: 0, max: 1 },
    applied: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['provider_id', 'category_id', 'skill_item_id', 'reviewed_by', 'admin_id', 'verification_record_id']) {
    if (ret[key] && typeof ret[key] !== 'string') ret[key] = ret[key].toString();
  }
  return ret;
};

verificationRecordSchema.set('toJSON', { transform: toJSONTransform });
adminReviewSchema.set('toJSON', { transform: toJSONTransform });
resumeParseResultSchema.set('toJSON', { transform: toJSONTransform });

export const SkillCategoryModel: Model<ISkillCategory> =
  mongoose.models.SkillCategory || mongoose.model<ISkillCategory>('SkillCategory', skillCategorySchema);

export const SkillItemModel: Model<ISkillItem> =
  mongoose.models.SkillItem || mongoose.model<ISkillItem>('SkillItem', skillItemSchema);

export const VerificationRecordModel: Model<IVerificationRecord> =
  mongoose.models.VerificationRecord || mongoose.model<IVerificationRecord>('VerificationRecord', verificationRecordSchema);

export const AdminReviewModel: Model<IAdminReview> =
  mongoose.models.AdminReview || mongoose.model<IAdminReview>('AdminReview', adminReviewSchema);

export const ConnectedAccountModel: Model<IConnectedAccount> =
  mongoose.models.ConnectedAccount || mongoose.model<IConnectedAccount>('ConnectedAccount', connectedAccountSchema);

export const ResumeParseResultModel: Model<IResumeParseResult> =
  mongoose.models.ResumeParseResult || mongoose.model<IResumeParseResult>('ResumeParseResult', resumeParseResultSchema);

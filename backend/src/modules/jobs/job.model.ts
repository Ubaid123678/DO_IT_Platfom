import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type JobType = 'physical' | 'digital' | 'errand';

export type JobStatus =
  | 'open'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'resolved';

export type BudgetType = 'fixed' | 'hourly';

export interface IJobLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  country?: string;
  formattedAddress?: string;
}

export interface IJobBudget {
  type: BudgetType;
  amount: number; // in USD cents for precision
  currency: string; // ISO 4217, e.g., 'USD'
  hourlyRate?: number; // for hourly jobs
  estimatedHours?: number; // for hourly jobs
}

export interface IJobSchedule {
  startsAt?: Date;
  endsAt?: Date;
  timezone: string; // IANA timezone
  isFlexible: boolean;
  preferredDays?: string[]; // Mon, Tue, etc.
  preferredShifts?: string[]; // Morning, Afternoon, etc.
}

export interface IJobRequirements {
  categories: string[]; // skill category IDs
  skillItems: string[]; // skill item IDs
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  languages?: string[]; // language codes
  certificationsRequired?: boolean;
  vehicleRequired?: boolean; // for errand jobs
}

export interface IJobClientInfo {
  clientId: mongoose.Types.ObjectId;
  clientName?: string; // denormalized for quick display
  clientAvatar?: string; // denormalized
}

export interface IJobProviderInfo {
  providerId?: mongoose.Types.ObjectId;
  providerName?: string;
  providerAvatar?: string;
  acceptedProposalId?: mongoose.Types.ObjectId;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IJobEscrow {
  lockedAmount: number; // in USD cents
  lockedAt?: Date;
  releasedAt?: Date;
  platformFeeAmount: number; // in USD cents
  platformFeePercent: number;
  transactionId?: string; // Stripe transaction ID
}

export interface IJobDispute {
  disputeId?: mongoose.Types.ObjectId;
  raisedBy?: 'client' | 'provider';
  raisedAt?: Date;
  reason?: string;
  status?: 'open' | 'under_review' | 'resolved';
  resolution?: 'client_wins' | 'provider_wins' | 'split';
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
}

export interface IJobReview {
  clientReview?: {
    rating: number; // 1-5
    comment?: string;
    createdAt: Date;
  };
  providerReview?: {
    rating: number; // 1-5
    comment?: string;
    createdAt: Date;
  };
}

export interface IJob extends Document {
  title: string;
  description: string;
  type: JobType;
  status: JobStatus;
  location: IJobLocation;
  budget: IJobBudget;
  schedule: IJobSchedule;
  requirements: IJobRequirements;
  client: IJobClientInfo;
  provider: IJobProviderInfo;
  escrow: IJobEscrow;
  dispute: IJobDispute;
  review: IJobReview;
  metadata: {
    views: number;
    applicationsCount: number;
    source?: string; // 'app', 'web', 'api'
    tags?: string[];
    isUrgent?: boolean;
    isFeatured?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  timeUntilStart?: number | null;
  duration?: number | null;
  // Instance methods
  canBeCancelled(userId: string, userRole: string): boolean;
  canTransitionTo(newStatus: JobStatus, userId: string, userRole: string): { allowed: boolean; reason?: string };
  // Indexes and virtuals
}

const jobLocationSchema = new Schema<IJobLocation>(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === 2,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    country: { type: String, trim: true, uppercase: true, minlength: 2, maxlength: 2 },
    formattedAddress: { type: String, trim: true },
  },
  { _id: false }
);

const jobBudgetSchema = new Schema<IJobBudget>(
  {
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: 'USD',
    },
    hourlyRate: { type: Number, min: 0 },
    estimatedHours: { type: Number, min: 0 },
  },
  { _id: false }
);

const jobScheduleSchema = new Schema<IJobSchedule>(
  {
    startsAt: { type: Date },
    endsAt: { type: Date },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
    },
    isFlexible: {
      type: Boolean,
      default: true,
    },
    preferredDays: [{ type: String, trim: true }],
    preferredShifts: [{ type: String, trim: true }],
  },
  { _id: false }
);

const jobRequirementsSchema = new Schema<IJobRequirements>(
  {
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SkillCategory',
        required: true,
      },
    ],
    skillItems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'SkillItem',
      },
    ],
    experienceLevel: {
      type: String,
      enum: ['entry', 'intermediate', 'expert'],
    },
    languages: [{ type: String, trim: true, minlength: 2, maxlength: 10 }],
    certificationsRequired: { type: Boolean, default: false },
    vehicleRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

const jobClientInfoSchema = new Schema<IJobClientInfo>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientName: { type: String, trim: true },
    clientAvatar: { type: String },
  },
  { _id: false }
);

const jobProviderInfoSchema = new Schema<IJobProviderInfo>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    providerName: { type: String, trim: true },
    providerAvatar: { type: String },
    acceptedProposalId: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const jobEscrowSchema = new Schema<IJobEscrow>(
  {
    lockedAmount: { type: Number, required: true, min: 0, default: 0 },
    lockedAt: { type: Date },
    releasedAt: { type: Date },
    platformFeeAmount: { type: Number, required: true, min: 0, default: 0 },
    platformFeePercent: { type: Number, required: true, min: 0, max: 100, default: 10 },
    transactionId: { type: String },
  },
  { _id: false }
);

const jobDisputeSchema = new Schema<IJobDispute>(
  {
    disputeId: { type: Schema.Types.ObjectId, ref: 'Dispute' },
    raisedBy: { type: String, enum: ['client', 'provider'] },
    raisedAt: { type: Date },
    reason: { type: String, trim: true },
    status: { type: String, enum: ['open', 'under_review', 'resolved'] },
    resolution: { type: String, enum: ['client_wins', 'provider_wins', 'split'] },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const jobReviewSchema = new Schema<IJobReview>(
  {
    clientReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
    },
    providerReview: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 1000 },
      createdAt: { type: Date, default: Date.now },
    },
  },
  { _id: false }
);

const jobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: 'text',
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ['physical', 'digital', 'errand'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'open',
      index: true,
    },
    location: {
      type: jobLocationSchema,
      required: true,
    },
    budget: {
      type: jobBudgetSchema,
      required: true,
    },
    schedule: {
      type: jobScheduleSchema,
      required: true,
    },
    requirements: {
      type: jobRequirementsSchema,
      required: true,
    },
    client: {
      type: jobClientInfoSchema,
      required: true,
    },
    provider: {
      type: jobProviderInfoSchema,
      default: {},
    },
    escrow: {
      type: jobEscrowSchema,
      default: {},
    },
    dispute: {
      type: jobDisputeSchema,
      default: {},
    },
    review: {
      type: jobReviewSchema,
      default: {},
    },
    metadata: {
      views: { type: Number, default: 0, min: 0 },
      applicationsCount: { type: Number, default: 0, min: 0 },
      source: { type: String, enum: ['app', 'web', 'api'], default: 'app' },
      tags: [{ type: String, trim: true, maxlength: 30 }],
      isUrgent: { type: Boolean, default: false, index: true },
      isFeatured: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ status: 1, type: 1, 'location.coordinates': '2dsphere' });
jobSchema.index({ 'client.clientId': 1, status: 1, createdAt: -1 });
jobSchema.index({ 'provider.providerId': 1, status: 1, createdAt: -1 });
jobSchema.index({ 'requirements.categories': 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ 'metadata.isUrgent': 1, status: 1, createdAt: -1 });

// Virtual for time until job starts
jobSchema.virtual('timeUntilStart').get(function (this: IJob) {
  if (!this.schedule.startsAt) return null;
  const diff = this.schedule.startsAt.getTime() - Date.now();
  return diff > 0 ? diff : 0;
});

// Virtual for job duration
jobSchema.virtual('duration').get(function (this: IJob) {
  if (!this.schedule.startsAt || !this.schedule.endsAt) return null;
  return this.schedule.endsAt.getTime() - this.schedule.startsAt.getTime();
});

// Helper methods
jobSchema.methods.canBeCancelled = function (this: IJob, userId: string, userRole: string): boolean {
  if (this.status !== 'open' && this.status !== 'in_progress') return false;
  if (userRole === 'admin') return true;
  if (userRole === 'client' && this.client.clientId.toString() === userId) {
    return this.status === 'open' || (this.status === 'in_progress' && !this.provider.providerId);
  }
  if (userRole === 'provider' && this.provider.providerId?.toString() === userId) {
    return this.status === 'in_progress';
  }
  return false;
};

jobSchema.methods.canTransitionTo = function (
  this: IJob,
  newStatus: JobStatus,
  userId: string,
  userRole: string
): { allowed: boolean; reason?: string } {
  const transitions: Record<JobStatus, JobStatus[]> = {
    open: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled', 'disputed'],
    completed: ['disputed'],
    cancelled: [],
    disputed: ['resolved'],
    resolved: [],
  };

  const allowed = transitions[this.status]?.includes(newStatus) ?? false;
  if (!allowed) {
    return { allowed: false, reason: `Cannot transition from ${this.status} to ${newStatus}` };
  }

  // Additional permission checks
  if (newStatus === 'in_progress') {
    if (!this.provider.providerId) {
      return { allowed: false, reason: 'No provider assigned' };
    }
  }
  if (newStatus === 'completed') {
    if (userRole === 'client' && this.client.clientId.toString() !== userId) {
      return { allowed: false, reason: 'Only client can confirm completion' };
    }
  }
  if (newStatus === 'cancelled') {
    const canCancel = this.canBeCancelled(userId, userRole);
    if (!canCancel) {
      return { allowed: false, reason: 'Not authorized to cancel this job' };
    }
  }

  return { allowed: true };
};

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['client.clientId', 'provider.providerId', 'provider.acceptedProposalId', 'dispute.disputeId', 'dispute.resolvedBy']) {
    const keys = key.split('.');
    let obj: any = ret;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
      if (!obj) break;
    }
    if (obj && obj[keys[keys.length - 1]] && typeof obj[keys[keys.length - 1]] !== 'string') {
      obj[keys[keys.length - 1]] = obj[keys[keys.length - 1]].toString();
    }
  }
  return ret;
};

jobSchema.set('toJSON', { transform: toJSONTransform });

export const JobModel: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', jobSchema);
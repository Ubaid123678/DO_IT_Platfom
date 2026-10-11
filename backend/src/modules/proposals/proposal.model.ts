import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ProposalStatus =
  | 'submitted'
  | 'withdrawn'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface IProposal extends Document {
  jobId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  bidAmount: number; // in USD cents
  bidType: 'fixed' | 'hourly';
  hourlyRate?: number; // for hourly bids
  estimatedHours?: number; // for hourly bids
  coverLetter: string;
  estimatedTimeline: string; // e.g., "2 weeks", "5 days"
  status: ProposalStatus;
  submittedAt: Date;
  respondedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  clientResponse?: {
    message?: string;
    respondedBy: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  canBeWithdrawn(): boolean;
  canBeAccepted(): boolean;
  canBeRejected(): boolean;
  accept(clientId: string, message?: string): Promise<IProposal>;
  reject(clientId: string, message?: string): Promise<IProposal>;
  withdraw(): Promise<IProposal>;
}

const proposalSchema = new Schema<IProposal>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bidType: {
      type: String,
      enum: ['fixed', 'hourly'],
      required: true,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    coverLetter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    estimatedTimeline: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['submitted', 'withdrawn', 'accepted', 'rejected', 'expired'],
      default: 'submitted',
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    respondedAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    withdrawnAt: { type: Date },
    clientResponse: {
      message: { type: String, trim: true, maxlength: 1000 },
      respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
proposalSchema.index({ jobId: 1, providerId: 1 }, { unique: true }); // One proposal per provider per job
proposalSchema.index({ jobId: 1, status: 1 });
proposalSchema.index({ providerId: 1, status: 1, createdAt: -1 });
proposalSchema.index({ clientId: 1, status: 1, createdAt: -1 });
proposalSchema.index({ status: 1, submittedAt: -1 });

// Virtual for bid total (for hourly bids)
proposalSchema.virtual('bidTotal').get(function (this: IProposal) {
  if (this.bidType === 'hourly' && this.hourlyRate && this.estimatedHours) {
    return this.hourlyRate * this.estimatedHours;
  }
  return this.bidAmount;
});

// Virtual for time since submission
proposalSchema.virtual('timeSinceSubmission').get(function (this: IProposal) {
  return Date.now() - this.submittedAt.getTime();
});

// Instance methods
proposalSchema.methods.canBeWithdrawn = function (this: IProposal): boolean {
  return this.status === 'submitted';
};

proposalSchema.methods.canBeAccepted = function (this: IProposal): boolean {
  return this.status === 'submitted';
};

proposalSchema.methods.canBeRejected = function (this: IProposal): boolean {
  return this.status === 'submitted';
};

proposalSchema.methods.accept = async function (
  this: IProposal,
  clientId: string,
  message?: string
) {
  if (!this.canBeAccepted()) {
    throw new Error('Proposal cannot be accepted');
  }
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.respondedAt = new Date();
  this.clientResponse = {
    message,
    respondedBy: new mongoose.Types.ObjectId(clientId),
  };
  await this.save();
  return this;
};

proposalSchema.methods.reject = async function (
  this: IProposal,
  clientId: string,
  message?: string
) {
  if (!this.canBeRejected()) {
    throw new Error('Proposal cannot be rejected');
  }
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.respondedAt = new Date();
  this.clientResponse = {
    message,
    respondedBy: new mongoose.Types.ObjectId(clientId),
  };
  await this.save();
  return this;
};

proposalSchema.methods.withdraw = async function (this: IProposal) {
  if (!this.canBeWithdrawn()) {
    throw new Error('Proposal cannot be withdrawn');
  }
  this.status = 'withdrawn';
  this.withdrawnAt = new Date();
  await this.save();
  return this;
};

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['jobId', 'providerId', 'clientId', 'clientResponse.respondedBy']) {
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

proposalSchema.set('toJSON', { transform: toJSONTransform });

export const ProposalModel: Model<IProposal> =
  mongoose.models.Proposal || mongoose.model<IProposal>('Proposal', proposalSchema);
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type DisputeStatus = 
  | 'open' 
  | 'evidence_submitted' 
  | 'under_review' 
  | 'resolved' 
  | 'closed';

export type DisputeRaisedBy = 'client' | 'provider';

export type DisputeVerdict = 'client_wins' | 'provider_wins' | 'split';

export type DisputeResolution = 'escrow_to_client' | 'escrow_to_provider' | 'escrow_split' | 'escrow_refunded';

export interface IEvidence {
  type: 'document' | 'image' | 'video' | 'text' | 'link';
  url?: string;
  content?: string;
  description?: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
}

export interface IVerdict {
  verdict: DisputeVerdict;
  resolution: DisputeResolution;
  decidedBy: mongoose.Types.ObjectId;
  decidedAt: Date;
  reasoning?: string;
  splitPercentage?: number; // for split verdict (0-100, client percentage)
}

export interface IDispute extends Document {
  jobId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  raisedBy: DisputeRaisedBy;
  raisedByUserId: mongoose.Types.ObjectId;
  againstUserId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: DisputeStatus;
  evidence: IEvidence[];
  verdict?: IVerdict;
  openedAt: Date;
  evidenceDeadline: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const evidenceSchema = new Schema<IEvidence>(
  {
    type: {
      type: String,
      enum: ['document', 'image', 'video', 'text', 'link'],
      required: true,
    },
    url: { type: String },
    content: { type: String },
    description: { type: String },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const verdictSchema = new Schema<IVerdict>(
  {
    verdict: {
      type: String,
      enum: ['client_wins', 'provider_wins', 'split'],
      required: true,
    },
    resolution: {
      type: String,
      enum: ['escrow_to_client', 'escrow_to_provider', 'escrow_split', 'escrow_refunded'],
      required: true,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    decidedAt: {
      type: Date,
      default: Date.now,
    },
    reasoning: { type: String, maxlength: 2000 },
    splitPercentage: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const disputeSchema = new Schema<IDispute>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
      index: true,
    },
    raisedBy: {
      type: String,
      enum: ['client', 'provider'],
      required: true,
    },
    raisedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    againstUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['open', 'evidence_submitted', 'under_review', 'resolved', 'closed'],
      default: 'open',
      required: true,
      index: true,
    },
    evidence: [evidenceSchema],
    verdict: verdictSchema,
    openedAt: {
      type: Date,
      default: Date.now,
    },
    evidenceDeadline: {
      type: Date,
      required: true,
    },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    adminNotes: { type: String, maxlength: 2000 },
  },
  { timestamps: true },
);

// Indexes
disputeSchema.index({ jobId: 1, status: 1 });
disputeSchema.index({ raisedByUserId: 1, status: 1 });
disputeSchema.index({ againstUserId: 1, status: 1 });
disputeSchema.index({ openedAt: -1 });
disputeSchema.index({ evidenceDeadline: 1, status: 1 });

// Instance methods
disputeSchema.methods.canSubmitEvidence = function (userId: string): boolean {
  if (this.status !== 'open' && this.status !== 'evidence_submitted') return false;
  if (new Date() > this.evidenceDeadline) return false;
  return this.raisedByUserId.toString() === userId || this.againstUserId.toString() === userId;
};

disputeSchema.methods.canAdminResolve = function (): boolean {
  return ['evidence_submitted', 'under_review'].includes(this.status);
};

disputeSchema.methods.isEvidencePeriodExpired = function (): boolean {
  return new Date() > this.evidenceDeadline;
};

// Static methods
disputeSchema.static('findByJob', async function (jobId: string) {
  return this.findOne({ jobId }).sort({ createdAt: -1 });
});

disputeSchema.static('findByUser', async function (userId: string, status?: DisputeStatus) {
  const filter: any = {
    $or: [{ raisedByUserId: userId }, { againstUserId: userId }],
  };
  if (status) filter.status = status;
  return this.find(filter).sort({ createdAt: -1 });
});

disputeSchema.static('findExpiredEvidence', async function () {
  return this.find({
    status: { $in: ['open', 'evidence_submitted'] },
    evidenceDeadline: { $lt: new Date() },
  });
});

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['jobId', 'proposalId', 'raisedByUserId', 'againstUserId', 'verdict.decidedBy']) {
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

disputeSchema.set('toJSON', { transform: toJSONTransform });

export const DisputeModel: Model<IDispute> =
  mongoose.models.Dispute || mongoose.model<IDispute>('Dispute', disputeSchema);
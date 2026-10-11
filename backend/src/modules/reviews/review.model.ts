import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type ReviewStatus = 'pending' | 'published' | 'flagged' | 'removed';

export interface IReview extends Document {
  jobId: mongoose.Types.ObjectId;
  proposalId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId; // who wrote the review
  revieweeId: mongoose.Types.ObjectId; // who is being reviewed
  reviewerRole: 'client' | 'provider'; // role of the reviewer
  rating: number; // 1-5
  title?: string;
  content?: string;
  // Detailed ratings
  communication?: number; // 1-5
  quality?: number; // 1-5
  timeliness?: number; // 1-5
  professionalism?: number; // 1-5
  status: ReviewStatus;
  flaggedAt?: Date;
  flaggedBy?: mongoose.Types.ObjectId;
  flagReason?: string;
  moderatedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  moderationReason?: string;
  isPublic: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
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
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewerRole: {
      type: String,
      enum: ['client', 'provider'],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: { type: String, maxlength: 100 },
    content: { type: String, maxlength: 2000 },
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    status: {
      type: String,
      enum: ['pending', 'published', 'flagged', 'removed'],
      default: 'published',
      required: true,
      index: true,
    },
    flaggedAt: { type: Date },
    flaggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    flagReason: { type: String, maxlength: 500 },
    moderatedAt: { type: Date },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderationReason: { type: String, maxlength: 500 },
    isPublic: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes
reviewSchema.index({ jobId: 1, reviewerId: 1 }, { unique: true }); // one review per job per reviewer
reviewSchema.index({ revieweeId: 1, status: 1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Instance methods
reviewSchema.methods.canBeEdited = function (userId: string): boolean {
  return this.reviewerId.toString() === userId && this.status === 'published';
};

reviewSchema.methods.canBeFlagged = function (userId: string): boolean {
  return this.revieweeId.toString() !== userId && this.status === 'published';
};

reviewSchema.methods.flag = async function (userId: string, reason: string): Promise<void> {
  this.status = 'flagged';
  this.flaggedAt = new Date();
  this.flaggedBy = new mongoose.Types.ObjectId(userId);
  this.flagReason = reason;
  await this.save();
};

reviewSchema.methods.moderate = async function (
  adminId: string,
  action: 'approve' | 'remove',
  reason?: string
): Promise<void> {
  this.status = action === 'approve' ? 'published' : 'removed';
  this.moderatedAt = new Date();
  this.moderatedBy = new mongoose.Types.ObjectId(adminId);
  this.moderationReason = reason;
  await this.save();
};

reviewSchema.methods.incrementHelpful = async function (): Promise<void> {
  this.helpfulCount += 1;
  await this.save();
};

// Static methods
reviewSchema.static('findByJob', async function (jobId: string) {
  return this.find({ jobId, status: 'published' }).sort({ createdAt: -1 });
});

reviewSchema.static('findByUser', async function (userId: string, role: 'client' | 'provider') {
  return this.find({
    $or: [{ reviewerId: userId }, { revieweeId: userId }],
    status: 'published',
  }).sort({ createdAt: -1 });
});

reviewSchema.static('getAverageRating', async function (userId: string) {
  const result = await this.aggregate([
    { $match: { revieweeId: new mongoose.Types.ObjectId(userId), status: 'published' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        avgCommunication: { $avg: '$communication' },
        avgQuality: { $avg: '$quality' },
        avgTimeliness: { $avg: '$timeliness' },
        avgProfessionalism: { $avg: '$professionalism' },
      },
    },
  ]);
  return result[0] || {
    averageRating: 0,
    totalReviews: 0,
    avgCommunication: 0,
    avgQuality: 0,
    avgTimeliness: 0,
    avgProfessionalism: 0,
  };
});

reviewSchema.static('getRatingDistribution', async function (userId: string) {
  const result = await this.aggregate([
    { $match: { revieweeId: new mongoose.Types.ObjectId(userId), status: 'published' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of result) {
    if (r._id >= 1 && r._id <= 5) distribution[r._id] = r.count;
  }
  return distribution;
});

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['jobId', 'proposalId', 'reviewerId', 'revieweeId', 'flaggedBy', 'moderatedBy']) {
    if (ret[key] && typeof ret[key] !== 'string') ret[key] = ret[key].toString();
  }
  return ret;
};

reviewSchema.set('toJSON', { transform: toJSONTransform });

export const ReviewModel: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);
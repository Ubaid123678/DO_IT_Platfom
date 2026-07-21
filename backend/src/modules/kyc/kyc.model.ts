import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

import type { UserRole } from '../auth/auth.model.js';
import type { StorageProvider } from '../../common/utils/storage.js';

export type KycStatus = 'pending' | 'approved' | 'rejected';

export type KycDocumentType =
  | 'id_card'
  | 'passport'
  | 'driver_license'
  | 'business_license'
  | 'proof_of_address'
  | 'other';

export interface IKycDocument extends Document {
  userId: Types.ObjectId;
  userRole: UserRole;
  status: KycStatus;
  documentType: KycDocumentType;
  storageProvider: StorageProvider;
  storageKey: string;
  storageUrl: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  countryCode: string;
  submittedAt: Date;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const kycDocumentSchema = new Schema<IKycDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userRole: {
      type: String,
      enum: ['pending', 'client', 'provider', 'admin'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['id_card', 'passport', 'driver_license', 'business_license', 'proof_of_address', 'other'],
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['mock', 's3', 'r2'],
      required: true,
    },
    storageKey: { type: String, required: true, unique: true, index: true },
    storageUrl: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    submittedAt: { type: Date, required: true, default: () => new Date() },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    reviewedAt: { type: Date, required: false },
    rejectionReason: { type: String, required: false },
    notes: { type: String, required: false },
  },
  { timestamps: true },
);

kycDocumentSchema.index({ userId: 1, createdAt: -1 });
kycDocumentSchema.index({ userId: 1, status: 1, createdAt: -1 });

kycDocumentSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    if (ret._id && typeof ret._id !== 'string') {
      ret._id = ret._id.toString();
    }
    if (ret.userId && typeof ret.userId !== 'string') {
      ret.userId = ret.userId.toString();
    }
    if (ret.reviewedBy && typeof ret.reviewedBy !== 'string') {
      ret.reviewedBy = ret.reviewedBy.toString();
    }
    return ret;
  },
});

const KycDocumentModel: Model<IKycDocument> =
  mongoose.models.KycDocument || mongoose.model<IKycDocument>('KycDocument', kycDocumentSchema);

export default KycDocumentModel;

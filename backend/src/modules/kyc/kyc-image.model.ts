import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IKycImage extends Document {
  userId: Types.ObjectId;
  imageType: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const kycImageSchema = new Schema<IKycImage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageType: {
      type: String,
      enum: ['document_front', 'document_back', 'face_clear', 'move_left', 'move_right', 'smile'],
      required: true,
    },
    url: { type: String, required: true },
  },
  { timestamps: true },
);

kycImageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
kycImageSchema.index({ userId: 1, imageType: 1 });

const KycImageModel: Model<IKycImage> =
  mongoose.models.KycImage || mongoose.model<IKycImage>('KycImage', kycImageSchema);

export default KycImageModel;

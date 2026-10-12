import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type AdminActionType = 'user_updated' | 'user_deleted';

export interface IAdminActionLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: AdminActionType;
  targetUserId: mongoose.Types.ObjectId;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason?: string;
  createdAt: Date;
}

const adminActionLogSchema = new Schema<IAdminActionLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['user_updated', 'user_deleted'],
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    before: { type: Schema.Types.Mixed, required: true },
    after: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: false, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adminActionLogSchema.index({ targetUserId: 1, createdAt: -1 });
adminActionLogSchema.index({ createdAt: -1 });

const AdminActionLogModel: Model<IAdminActionLog> =
  mongoose.models.AdminActionLog ||
  mongoose.model<IAdminActionLog>('AdminActionLog', adminActionLogSchema);

export default AdminActionLogModel;

import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'location' | 'voice';
export type ConversationType = 'direct' | 'group' | 'job' | 'support';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: MessageType;
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
    replyToMessageId?: mongoose.Types.ObjectId;
    forwardFromMessageId?: mongoose.Types.ObjectId;
    isEdited?: boolean;
    editedAt?: Date;
  };
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  type: ConversationType;
  participants: mongoose.Types.ObjectId[];
  jobId?: mongoose.Types.ObjectId;
  proposalId?: mongoose.Types.ObjectId;
  disputeId?: mongoose.Types.ObjectId;
  title?: string;
  avatar?: string;
  lastMessageId?: mongoose.Types.ObjectId;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  unreadCounts: Map<string, number>;
  mutedBy: mongoose.Types.ObjectId[];
  archivedBy: mongoose.Types.ObjectId[];
  pinnedBy: mongoose.Types.ObjectId[];
  settings?: {
    notifications?: boolean;
    disappearingMessages?: { enabled: boolean; duration?: number };
    encryption?: boolean;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 
  | 'message' 
  | 'job_created' 
  | 'job_updated' 
  | 'job_assigned' 
  | 'job_completed' 
  | 'job_cancelled'
  | 'proposal_received' 
  | 'proposal_accepted' 
  | 'proposal_rejected' 
  | 'proposal_withdrawn'
  | 'dispute_created' 
  | 'dispute_evidence_added' 
  | 'dispute_resolved' 
  | 'review_received' 
  | 'review_flagged' 
  | 'review_moderated' 
  | 'payout_requested' 
  | 'payout_completed' 
  | 'payout_failed' 
  | 'wallet_topup' 
  | 'wallet_low_balance' 
  | 'wallet_escrow_locked' 
  | 'wallet_escrow_released' 
  | 'wallet_escrow_refunded' 
  | 'verification_submitted' 
  | 'verification_approved' 
  | 'verification_rejected' 
  | 'kyc_submitted' 
  | 'kyc_approved' 
  | 'kyc_rejected' 
  | 'system_announcement' 
  | 'promotion' 
  | 'security_alert';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'dismissed';
  readAt?: Date;
  channelsStatus: {
    in_app?: { sent: boolean; sentAt?: Date; read: boolean; readAt?: Date };
    push?: { sent: boolean; sentAt?: Date; delivered: boolean; deliveredAt?: Date; failed?: boolean; failureReason?: string };
    email?: { sent: boolean; sentAt?: Date; delivered: boolean; opened: boolean; openedAt?: Date; failed?: boolean; failureReason?: string };
    sms?: { sent: boolean; sentAt?: Date; delivered: boolean; failed?: boolean; failureReason?: string };
  };
  scheduledFor?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  relatedEntityId?: mongoose.Types.ObjectId;
  relatedEntityType?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'location', 'voice'],
      default: 'text',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    metadata: {
      fileName: { type: String },
      fileSize: { type: Number },
      mimeType: { type: String },
      duration: { type: Number },
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      replyToMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
      forwardFromMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
      isEdited: { type: Boolean, default: false },
      editedAt: { type: Date },
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, sentAt: -1 });
messageSchema.index({ senderId: 1, sentAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });
messageSchema.index({ 'metadata.replyToMessageId': 1 });

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ['direct', 'group', 'job', 'support'],
      default: 'direct',
      required: true,
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      index: true,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: 'Proposal',
      index: true,
    },
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: 'Dispute',
      index: true,
    },
    title: { type: String, maxlength: 100 },
    avatar: { type: String },
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessagePreview: { type: String, maxlength: 200 },
    lastMessageAt: { type: Date, index: true },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    settings: {
      notifications: { type: Boolean, default: true },
      disappearingMessages: {
        enabled: { type: Boolean, default: false },
        duration: { type: Number },
      },
      encryption: { type: Boolean, default: false },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, type: 1 });
conversationSchema.index({ jobId: 1, type: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'message',
        'job_created', 'job_updated', 'job_assigned', 'job_completed', 'job_cancelled',
        'proposal_received', 'proposal_accepted', 'proposal_rejected', 'proposal_withdrawn',
        'dispute_created', 'dispute_evidence_added', 'dispute_resolved',
        'review_received', 'review_flagged', 'review_moderated',
        'payout_requested', 'payout_completed', 'payout_failed',
        'wallet_topup', 'wallet_low_balance', 'wallet_escrow_locked', 'wallet_escrow_released', 'wallet_escrow_refunded',
        'verification_submitted', 'verification_approved', 'verification_rejected',
        'kyc_submitted', 'kyc_approved', 'kyc_rejected',
        'system_announcement', 'promotion', 'security_alert'
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 1000 },
    data: { type: Schema.Types.Mixed, default: {} },
    channels: [{
      type: String,
      enum: ['in_app', 'push', 'email', 'sms'],
      required: true,
    }],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'dismissed'],
      default: 'pending',
      index: true,
    },
    readAt: { type: Date },
    channelsStatus: {
      in_app: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        read: { type: Boolean, default: false },
        readAt: { type: Date },
      },
      push: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        delivered: { type: Boolean, default: false },
        deliveredAt: { type: Date },
        failed: { type: Boolean, default: false },
        failureReason: { type: String },
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        delivered: { type: Boolean, default: false },
        opened: { type: Boolean, default: false },
        openedAt: { type: Date },
        failed: { type: Boolean, default: false },
        failureReason: { type: String },
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
        delivered: { type: Boolean, default: false },
        failed: { type: Boolean, default: false },
        failureReason: { type: String },
      },
    },
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    expiresAt: { type: Date },
    relatedEntityId: { type: Schema.Types.ObjectId, index: true },
    relatedEntityType: { type: String },
    actionUrl: { type: String, maxlength: 500 },
    actionText: { type: String, maxlength: 50 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ relatedEntityId: 1, relatedEntityType: 1 });

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['conversationId', 'senderId', 'receiverId', 'lastMessageId', 'createdBy', 'userId', 'relatedEntityId']) {
    if (Array.isArray(ret[key])) {
      ret[key] = ret[key].map((v: any) => (typeof v === 'object' && v !== null && typeof v.toString === 'function' ? v.toString() : v));
    } else if (ret[key] && typeof ret[key] === 'object' && ret[key] !== null && typeof ret[key].toString === 'function') {
      ret[key] = ret[key].toString();
    }
  }
  // Handle Map fields
  for (const key of ['unreadCounts']) {
    if (ret[key] instanceof Map) {
      const obj: Record<string, number> = {};
      for (const [k, v] of ret[key]) {
        obj[k] = v;
      }
      ret[key] = obj;
    } else if (ret[key] && typeof ret[key] === 'object' && !(ret[key] instanceof Map)) {
      // Already an object
    }
  }
  return ret;
};

messageSchema.set('toJSON', { transform: toJSONTransform });
conversationSchema.set('toJSON', { transform: toJSONTransform });
notificationSchema.set('toJSON', { transform: toJSONTransform });

export const MessageModel: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
export const ConversationModel: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', conversationSchema);
export const NotificationModel: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
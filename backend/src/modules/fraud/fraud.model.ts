import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type FraudRuleType = 
  | 'velocity_check' 
  | 'geo_anomaly' 
  | 'device_fingerprint' 
  | 'ip_reputation' 
  | 'payment_velocity' 
  | 'account_takeover' 
  | 'bot_detection' 
  | 'card_testing' 
  | 'account_creation_spam' 
  | 'promo_abuse' 
  | 'chargeback_risk' 
  | 'custom';

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FraudStatus = 'pending' | 'under_review' | 'confirmed_fraud' | 'false_positive' | 'resolved' | 'dismissed';
export type FraudAction = 'block' | 'challenge' | 'monitor' | 'alert' | 'require_2fa' | 'lock_account' | 'notify_user' | 'notify_admin' | 'require_kyc' | 'block_ip' | 'block_device';

export interface IFraudRule {
  name: string;
  description: string;
  type: FraudRuleType;
  severity: FraudSeverity;
  enabled: boolean;
  conditions: Record<string, any>; // Rule-specific conditions
  actions: FraudAction[];
  scoreThreshold: number; // 0-100
  windowMs: number; // Time window in milliseconds
  maxTriggers: number; // Max triggers before action
  cooldownMs: number; // Cooldown between triggers
  metadata?: Record<string, any>;
}

export interface IFraudFlag {
  userId: mongoose.Types.ObjectId;
  ruleId: mongoose.Types.ObjectId;
  ruleName: string;
  ruleType: FraudRuleType;
  severity: FraudSeverity;
  score: number; // 0-100
  triggeredAt: Date;
  status: FraudStatus;
  evidence: Record<string, any>;
  context: {
    ip?: string;
    deviceId?: string;
    userAgent?: string;
    location?: { country: string; city: string; lat: number; lng: number };
    deviceFingerprint?: string;
    sessionId?: string;
    requestId?: string;
  };
  actionsTaken: FraudAction[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}


export interface IFraudRule extends Document {
  name: string;
  description: string;
  type: FraudRuleType;
  severity: FraudSeverity;
  enabled: boolean;
  conditions: Record<string, any>;
  actions: FraudAction[];
  scoreThreshold: number;
  windowMs: number;
  maxTriggers: number;
  cooldownMs: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFraudFlag extends Document {
  userId: mongoose.Types.ObjectId;
  ruleId: mongoose.Types.ObjectId;
  ruleName: string;
  ruleType: FraudRuleType;
  severity: FraudSeverity;
  score: number;
  triggeredAt: Date;
  status: FraudStatus;
  evidence: Record<string, any>;
  context: {
    ip?: string;
    deviceId?: string;
    userAgent?: string;
    location?: { country: string; city: string; lat: number; lng: number };
    deviceFingerprint?: string;
    sessionId?: string;
    requestId?: string;
  };
  actionsTaken: FraudAction[];
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFraudCase extends Document {
  userId: mongoose.Types.ObjectId;
  flags: mongoose.Types.ObjectId[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  investigatorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolution?: 'fraud_confirmed' | 'false_positive' | 'insufficient_evidence' | 'user_educated' | 'account_closed';
}

const fraudRuleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'velocity_check', 'geo_anomaly', 'device_fingerprint', 'ip_reputation',
        'payment_velocity', 'account_takeover', 'bot_detection', 'card_testing',
        'account_creation_spam', 'promo_abuse', 'chargeback_risk', 'custom'
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium',
    },
    enabled: { type: Boolean, default: true },
    conditions: { type: Schema.Types.Mixed, default: {} },
    actions: [{
      type: String,
      enum: [
        'block', 'challenge', 'monitor', 'alert', 'require_2fa', 'lock_account',
        'notify_user', 'notify_admin', 'require_kyc', 'block_ip', 'block_device'
      ],
    }],
    scoreThreshold: { type: Number, required: true, min: 0, max: 100 },
    windowMs: { type: Number, required: true, min: 1000 },
    maxTriggers: { type: Number, default: 10 },
    cooldownMs: { type: Number, default: 300000 }, // 5 minutes
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

fraudRuleSchema.index({ type: 1, enabled: 1 });
fraudRuleSchema.index({ severity: 1, enabled: 1 });

const fraudFlagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ruleId: { type: Schema.Types.ObjectId, ref: 'FraudRule', required: true, index: true },
    ruleName: { type: String, required: true },
    ruleType: {
      type: String,
      enum: [
        'velocity_check', 'geo_anomaly', 'device_fingerprint', 'ip_reputation',
        'payment_velocity', 'account_takeover', 'bot_detection', 'card_testing',
        'account_creation_spam', 'promo_abuse', 'chargeback_risk', 'custom'
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    triggeredAt: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'confirmed_fraud', 'false_positive', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    evidence: { type: Schema.Types.Mixed, default: {} },
    context: {
      ip: { type: String },
      deviceId: { type: String },
      userAgent: { type: String },
      location: {
        country: { type: String },
        city: { type: String },
        lat: { type: Number },
        lng: { type: Number },
      },
      deviceFingerprint: { type: String },
      sessionId: { type: String },
      requestId: { type: String },
    },
    actionsTaken: [{
      type: String,
      enum: [
        'block', 'challenge', 'monitor', 'alert', 'require_2fa', 'lock_account',
        'notify_user', 'notify_admin', 'require_kyc', 'block_ip', 'block_device'
      ],
    }],
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, maxlength: 2000 },
    resolvedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

fraudFlagSchema.index({ userId: 1, status: 1, triggeredAt: -1 });
fraudFlagSchema.index({ ruleId: 1, triggeredAt: -1 });
fraudFlagSchema.index({ status: 1, severity: 1, triggeredAt: -1 });
fraudFlagSchema.index({ 'context.ip': 1, triggeredAt: -1 });
fraudFlagSchema.index({ 'context.deviceId': 1, triggeredAt: -1 });

const fraudCaseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    flags: [{ type: Schema.Types.ObjectId, ref: 'FraudFlag' }],
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    summary: { type: String, required: true, maxlength: 500 },
    investigatorNotes: { type: String, maxlength: 5000 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolution: {
      type: String,
      enum: ['fraud_confirmed', 'false_positive', 'insufficient_evidence', 'user_educated', 'account_closed'],
    },
  },
  { timestamps: true }
);

fraudCaseSchema.index({ userId: 1, status: 1 });
fraudCaseSchema.index({ assignedTo: 1, status: 1 });

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['userId', 'ruleId', 'reviewedBy', 'assignedTo', 'flags']) {
    if (Array.isArray(ret[key])) {
      ret[key] = ret[key].map((v: any) => (typeof v === 'object' && v !== null && typeof v.toString === 'function' ? v.toString() : v));
    } else if (ret[key] && typeof ret[key] === 'object' && ret[key] !== null && typeof ret[key].toString === 'function') {
      ret[key] = ret[key].toString();
    }
  }
  return ret;
};

fraudRuleSchema.set('toJSON', { transform: toJSONTransform });

const fraudFlagSchemaTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['userId', 'ruleId', 'reviewedBy', 'flags']) {
    if (Array.isArray(ret[key])) {
      ret[key] = ret[key].map((v: any) => (typeof v === 'object' && v !== null && typeof v.toString === 'function' ? v.toString() : v));
    } else if (ret[key] && typeof ret[key] === 'object' && ret[key] !== null && typeof ret[key].toString === 'function') {
      ret[key] = ret[key].toString();
    }
  }
  return ret;
};

fraudFlagSchema.set('toJSON', { transform: fraudFlagSchemaTransform });
fraudCaseSchema.set('toJSON', { transform: toJSONTransform });

export const FraudRuleModel = mongoose.models.FraudRule || mongoose.model('FraudRule', fraudRuleSchema);
export const FraudFlagModel = mongoose.models.FraudFlag || mongoose.model('FraudFlag', fraudFlagSchema);
export const FraudCaseModel = mongoose.models.FraudCase || mongoose.model('FraudCase', fraudCaseSchema);
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type WalletType = 'user' | 'platform' | 'escrow' | 'fee';

export type TransactionType =
  | 'topup'           // User adds funds via Stripe
  | 'topup_reversal'  // Failed topup reversal
  | 'escrow_lock'     // Funds locked for job
  | 'escrow_release'  // Funds released to provider
  | 'escrow_refund'   // Funds refunded to client
  | 'platform_fee'    // Platform fee collected
  | 'payout'          // Provider withdrawal
  | 'payout_reversal' // Failed payout reversal
  | 'adjustment'      // Manual adjustment
  | 'refund';         // General refund

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type LedgerEntryType = 'debit' | 'credit';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  type: WalletType;
  balance: number; // in USD cents
  currency: string; // ISO 4217, default 'USD'
  escrowBalance: number; // funds locked in escrow
  availableBalance: number; // balance - escrowBalance
  isActive: boolean;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILedgerEntry extends Document {
  transactionId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  entryType: LedgerEntryType;
  amount: number; // in USD cents (always positive)
  balanceAfter: number; // wallet balance after this entry
  description: string;
  referenceId?: mongoose.Types.ObjectId; // jobId, proposalId, etc.
  referenceType?: string; // 'job', 'proposal', 'topup', 'payout', etc.
  createdAt: Date;
}

export interface ITransaction extends Document {
  transactionId: string; // unique human-readable ID (e.g., TXN_abc123)
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // in USD cents (positive for credit, negative for debit from user perspective)
  currency: string;
  netAmount: number; // amount after fees
  feeAmount: number; // platform fee in cents
  description: string;
  metadata: {
    stripePaymentIntentId?: string;
    stripeChargeId?: string;
    stripeRefundId?: string;
    jobId?: string;
    proposalId?: string;
    payoutId?: string;
    idempotencyKey?: string;
    failureReason?: string;
    [key: string]: any;
  };
  ledgerEntries: mongoose.Types.ObjectId[]; // references to ledger entries
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayout extends Document {
  payoutId: string; // unique human-readable ID
  providerId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  amount: number; // in USD cents
  currency: string;
  netAmount: number; // after platform fee
  feeAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  wiseTransferId?: string;
  wiseQuoteId?: string;
  destinationAccountId?: string;
  failureReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['user', 'platform', 'escrow', 'fee'],
      required: true,
      default: 'user',
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    escrowBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTransactionAt: { type: Date },
  },
  { timestamps: true }
);

walletSchema.index({ userId: 1, type: 1 });

const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    referenceId: { type: Schema.Types.ObjectId, index: true },
    referenceType: { type: String, trim: true, maxlength: 50 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ledgerEntrySchema.index({ walletId: 1, createdAt: -1 });
ledgerEntrySchema.index({ userId: 1, createdAt: -1 });
ledgerEntrySchema.index({ referenceId: 1, referenceType: 1 });

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'topup',
        'topup_reversal',
        'escrow_lock',
        'escrow_release',
        'escrow_refund',
        'platform_fee',
        'payout',
        'payout_reversal',
        'adjustment',
        'refund',
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    netAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    feeAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ledgerEntries: [{
      type: Schema.Types.ObjectId,
      ref: 'LedgerEntry',
    }],
    completedAt: { type: Date },
    failedAt: { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'metadata.idempotencyKey': 1 }, { unique: true, sparse: true });
transactionSchema.index({ 'metadata.jobId': 1 });
transactionSchema.index({ 'metadata.proposalId': 1 });

const payoutSchema = new Schema<IPayout>(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      required: true,
      index: true,
    },
    wiseTransferId: { type: String, trim: true },
    wiseQuoteId: { type: String, trim: true },
    destinationAccountId: { type: String, trim: true },
    failureReason: { type: String, trim: true, maxlength: 500 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

payoutSchema.index({ providerId: 1, createdAt: -1 });
payoutSchema.index({ status: 1, createdAt: -1 });

const toJSONTransform = (_doc: Document, ret: Record<string, unknown>) => {
  if (ret._id && typeof ret._id !== 'string') ret._id = ret._id.toString();
  for (const key of ['userId', 'walletId', 'transactionId', 'referenceId', 'providerId', 'ledgerEntries']) {
    if (Array.isArray(ret[key])) {
      ret[key] = ret[key].map((v: any) => (typeof v === 'object' && v !== null && typeof v.toString === 'function' ? v.toString() : v));
    } else if (ret[key] && typeof ret[key] === 'object' && ret[key] !== null && typeof ret[key].toString === 'function') {
      ret[key] = ret[key].toString();
    }
  }
  return ret;
};

walletSchema.set('toJSON', { transform: toJSONTransform });
ledgerEntrySchema.set('toJSON', { transform: toJSONTransform });
transactionSchema.set('toJSON', { transform: toJSONTransform });
payoutSchema.set('toJSON', { transform: toJSONTransform });

export const WalletModel: Model<IWallet> = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', walletSchema);
export const LedgerEntryModel: Model<ILedgerEntry> = mongoose.models.LedgerEntry || mongoose.model<ILedgerEntry>('LedgerEntry', ledgerEntrySchema);
export const TransactionModel: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export const PayoutModel: Model<IPayout> = mongoose.models.Payout || mongoose.model<IPayout>('Payout', payoutSchema);
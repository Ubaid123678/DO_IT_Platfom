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
  // Multi-currency balances (stored in cents)
  balances: Map<string, number>; // currency -> amount in cents
  // Default/base currency for the wallet
  baseCurrency: string; // ISO 4217, default 'USD'
  // Escrow balances per currency
  escrowBalances: Map<string, number>; // currency -> amount in cents locked in escrow
  // Available balances per currency (balance - escrow)
  availableBalances: Map<string, number>; // currency -> amount in cents
  isActive: boolean;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Helper methods for wallet operations
export interface IWalletMethods {
  getBalance(currency: string): number;
  getEscrowBalance(currency: string): number;
  getAvailableBalance(currency: string): number;
  setBalance(currency: string, amount: number): void;
  addBalance(currency: string, amount: number): void;
  deductBalance(currency: string, amount: number): void;
  lockEscrow(currency: string, amount: number): void;
  releaseEscrow(currency: string, amount: number): void;
  getTotalBalanceInUSD(fxRateService: any): Promise<number>;
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
  amount: number; // in source currency cents (positive for credit, negative for debit from user perspective)
  currency: string; // ISO 4217
  netAmount: number; // amount after fees (in currency cents)
  feeAmount: number; // platform fee in cents (in currency)
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
    fxRate?: number; // FX rate used for conversion
    targetCurrency?: string; // Target currency for cross-currency transactions
    targetAmount?: number; // Target amount in target currency cents
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
  amount: number; // in source currency cents
  currency: string; // ISO 4217
  netAmount: number; // after platform fee (in currency cents)
  feeAmount: number; // platform fee in cents (in currency)
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
    // Multi-currency balances (stored as Map)
    balances: {
      type: Map,
      of: Number,
      default: {},
    },
    baseCurrency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    escrowBalances: {
      type: Map,
      of: Number,
      default: {},
    },
    availableBalances: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTransactionAt: { type: Date },
  },
  { timestamps: true }
);

// Static methods for multi-currency operations
walletSchema.static('getBalance', async function (this: any, userId: string, currency: string): Promise<number> {
  const wallet = await this.findOne({ userId });
  if (!wallet) return 0;
  return wallet.balances.get(currency) || 0;
});

walletSchema.static('getEscrowBalance', async function (this: any, userId: string, currency: string): Promise<number> {
  const wallet = await this.findOne({ userId });
  if (!wallet) return 0;
  return wallet.escrowBalances.get(currency) || 0;
});

walletSchema.static('getAvailableBalance', async function (this: any, userId: string, currency: string): Promise<number> {
  const wallet = await this.findOne({ userId });
  if (!wallet) return 0;
  return wallet.availableBalances.get(currency) || 0;
});

walletSchema.static('addBalance', async function (this: any, userId: string, currency: string, amount: number): Promise<void> {
  const wallet = await this.findOne({ userId });
  if (!wallet) throw new Error('Wallet not found');
  
  const current = wallet.balances.get(currency) || 0;
  wallet.balances.set(currency, current + amount);
  wallet.availableBalances.set(currency, (wallet.availableBalances.get(currency) || 0) + amount);
  wallet.lastTransactionAt = new Date();
  await wallet.save();
});

walletSchema.static('deductBalance', async function (this: any, userId: string, currency: string, amount: number): Promise<void> {
  const wallet = await this.findOne({ userId });
  if (!wallet) throw new Error('Wallet not found');
  
  const current = wallet.balances.get(currency) || 0;
  if (current < amount) throw new Error('Insufficient balance');
  
  wallet.balances.set(currency, current - amount);
  wallet.availableBalances.set(currency, (wallet.availableBalances.get(currency) || 0) - amount);
  wallet.lastTransactionAt = new Date();
  await wallet.save();
});

walletSchema.static('lockEscrow', async function (this: any, userId: string, currency: string, amount: number): Promise<void> {
  const wallet = await this.findOne({ userId });
  if (!wallet) throw new Error('Wallet not found');
  
  const available = wallet.availableBalances.get(currency) || 0;
  if (available < amount) throw new Error('Insufficient available balance');
  
  wallet.escrowBalances.set(currency, (wallet.escrowBalances.get(currency) || 0) + amount);
  wallet.availableBalances.set(currency, available - amount);
  wallet.lastTransactionAt = new Date();
  await wallet.save();
});

walletSchema.static('releaseEscrow', async function (this: any, userId: string, currency: string, amount: number): Promise<void> {
  const wallet = await this.findOne({ userId });
  if (!wallet) throw new Error('Wallet not found');
  
  const escrow = wallet.escrowBalances.get(currency) || 0;
  if (escrow < amount) throw new Error('Insufficient escrow balance');
  
  wallet.escrowBalances.set(currency, escrow - amount);
  wallet.availableBalances.set(currency, (wallet.availableBalances.get(currency) || 0) + amount);
  wallet.lastTransactionAt = new Date();
  await wallet.save();
});

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
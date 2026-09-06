import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { WalletModel, type IWallet } from './wallet.model.js';
import { TransactionModel, type ITransaction, type TransactionType, type TransactionStatus } from './wallet.model.js';
import { PayoutModel, type IPayout } from './wallet.model.js';
import { JobModel } from '../jobs/job.model.js';
import { stripeService } from './stripe.service.js';

const PLATFORM_FEE_PERCENT = 10;
const generateTransactionId = () => `TXN_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const generatePayoutId = () => `PAYOUT_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const serializeWallet = (wallet: IWallet) => {
  const obj = wallet.toJSON?.() ?? wallet;
  return {
    _id: obj._id,
    userId: obj.userId,
    type: obj.type,
    balance: obj.balance,
    currency: obj.currency,
    escrowBalance: obj.escrowBalance,
    availableBalance: obj.availableBalance,
    isActive: obj.isActive,
    lastTransactionAt: obj.lastTransactionAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const serializeTransaction = (txn: ITransaction) => {
  const obj = txn.toJSON?.() ?? txn;
  return {
    _id: obj._id,
    transactionId: obj.transactionId,
    userId: obj.userId,
    walletId: obj.walletId,
    type: obj.type,
    status: obj.status,
    amount: obj.amount,
    currency: obj.currency,
    netAmount: obj.netAmount,
    feeAmount: obj.feeAmount,
    description: obj.description,
    metadata: obj.metadata,
    ledgerEntries: obj.ledgerEntries,
    completedAt: obj.completedAt,
    failedAt: obj.failedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const serializePayout = (payout: IPayout) => {
  const obj = payout.toJSON?.() ?? payout;
  return {
    _id: obj._id,
    payoutId: obj.payoutId,
    providerId: obj.providerId,
    walletId: obj.walletId,
    amount: obj.amount,
    currency: obj.currency,
    netAmount: obj.netAmount,
    feeAmount: obj.feeAmount,
    status: obj.status,
    wiseTransferId: obj.wiseTransferId,
    wiseQuoteId: obj.wiseQuoteId,
    destinationAccountId: obj.destinationAccountId,
    failureReason: obj.failureReason,
    completedAt: obj.completedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

type LedgerEntryInput = {
  walletId: mongoose.Types.ObjectId;
  userId: string;
  entryType: 'debit' | 'credit';
  amount: number;
  description: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: string;
};

const createLedgerEntries = async (
  session: mongoose.ClientSession,
  transactionId: mongoose.Types.ObjectId,
  entries: LedgerEntryInput[]
): Promise<mongoose.Types.ObjectId[]> => {
  const ledgerEntryIds: mongoose.Types.ObjectId[] = [];

  for (const entry of entries) {
    const wallet = await WalletModel.findById(entry.walletId).session(session);
    if (!wallet) {
      throw new AppError('Wallet not found', 404, 'WALLET_NOT_FOUND');
    }

    const balanceAfter = entry.entryType === 'credit'
      ? wallet.balance + entry.amount
      : wallet.balance - entry.amount;

    if (balanceAfter < 0) {
      throw new AppError('Insufficient funds', 400, 'INSUFFICIENT_FUNDS');
    }

    // Update wallet balance
    if (entry.entryType === 'credit') {
      wallet.balance += entry.amount;
    } else {
      wallet.balance -= entry.amount;
    }

    wallet.lastTransactionAt = new Date();
    await wallet.save({ session });

    const ledgerEntry = await mongoose.model('LedgerEntry').create([{
      transactionId,
      walletId: entry.walletId,
      userId: new mongoose.Types.ObjectId(entry.userId),
      entryType: entry.entryType,
      amount: entry.amount,
      balanceAfter: wallet.balance,
      description: entry.description,
      referenceId: entry.referenceId,
      referenceType: entry.referenceType,
    }], { session });

    ledgerEntryIds.push(ledgerEntry[0]._id);
  }

  return ledgerEntryIds;
};

export const walletService = {
  // Get or create user wallet
  getOrCreateWallet: async (userId: string) => {
    let wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      wallet = await WalletModel.create({
        userId,
        type: 'user',
        balance: 0,
        currency: 'USD',
        escrowBalance: 0,
        availableBalance: 0,
        isActive: true,
      });
    }
    return serializeWallet(wallet);
  },

  // Get wallet by user ID
  getWallet: async (userId: string) => {
    const wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      throw new AppError('Wallet not found', 404, 'WALLET_NOT_FOUND');
    }
    return serializeWallet(wallet);
  },

  // Create Stripe PaymentIntent for top-up
  createTopUpIntent: async (userId: string, amountCents: number, currency: string, idempotencyKey: string) => {
    const wallet = await walletService.getOrCreateWallet(userId);

    // Check for existing pending top-up with same idempotency key
    const existing = await TransactionModel.findOne({
      'metadata.idempotencyKey': idempotencyKey,
      type: 'topup',
      status: 'pending',
    });

    if (existing) {
      // Return existing payment intent
      const stripe = await stripeService.getPaymentIntent(existing.metadata.stripePaymentIntentId);
      return {
        clientSecret: stripe.client_secret,
        transactionId: existing.transactionId,
        amountCents: existing.amount,
      };
    }

    const transactionId = generateTransactionId();

    const metadata = {
      userId,
      walletId: wallet._id.toString(),
      idempotencyKey,
      type: 'wallet_topup',
    };

    const paymentIntent = await stripeService.createPaymentIntent(
      amountCents,
      currency,
      metadata,
      idempotencyKey
    );

    // Create pending transaction record
    const transaction = await TransactionModel.create({
      transactionId,
      userId,
      walletId: wallet._id,
      type: 'topup',
      status: 'pending',
      amount: amountCents,
      currency,
      netAmount: amountCents,
      feeAmount: 0,
      description: `Wallet top-up: ${paymentIntent.currency.toUpperCase()} ${(amountCents / 100).toFixed(2)}`,
      metadata: {
        stripePaymentIntentId: paymentIntent.id,
        idempotencyKey,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      transactionId,
      amountCents,
    };
  },

  // Confirm top-up after Stripe payment
  confirmTopUp: async (paymentIntentId: string) => {
    const stripe = await stripeService.getPaymentIntent(paymentIntentId);

    if (stripe.status !== 'succeeded') {
      throw new AppError('Payment not completed', 400, 'PAYMENT_NOT_COMPLETED');
    }

    const transaction = await TransactionModel.findOne({
      'metadata.stripePaymentIntentId': paymentIntentId,
      type: 'topup',
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    if (transaction.status === 'completed') {
      return serializeTransaction(transaction);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await WalletModel.findById(transaction.walletId).session(session);
      if (!wallet) throw new AppError('Wallet not found', 404, 'WALLET_NOT_FOUND');

      // Create ledger entries for double-entry bookkeeping
      // Credit user wallet
      const ledgerEntries = await createLedgerEntries(session, transaction._id, [{
        walletId: wallet._id,
        userId: transaction.userId.toString(),
        entryType: 'credit',
        amount: transaction.amount,
        description: `Wallet top-up via Stripe`,
        referenceId: transaction._id,
        referenceType: 'topup',
      }]);

      // Update transaction
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.ledgerEntries = ledgerEntries.map(e => e);
      await transaction.save({ session });

      await session.commitTransaction();
      await session.endSession();

      return serializeTransaction(transaction);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  },

  // Handle Stripe webhook for payment confirmation
  handleTopUpWebhook: async (event: any) => {
    const paymentIntent = event.data.object;

    if (event.type === 'payment_intent.succeeded') {
      // Find transaction by payment intent ID
      const transaction = await TransactionModel.findOne({
        'metadata.stripePaymentIntentId': paymentIntent.id,
        type: 'topup',
        status: 'pending',
      });

      if (transaction && transaction.status === 'pending') {
        await walletService.confirmTopUp(paymentIntent.id);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const transaction = await TransactionModel.findOne({
        'metadata.stripePaymentIntentId': paymentIntent.id,
        type: 'topup',
      });

      if (transaction && transaction.status === 'pending') {
        transaction.status = 'failed';
        transaction.failedAt = new Date();
        transaction.metadata.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
        await transaction.save();
      }
    }
  },

  // Lock escrow for a job (called when proposal is accepted)
  lockEscrow: async (jobId: string, proposalId: string, amountCents: number, idempotencyKey: string) => {
    // Check for existing escrow lock with same idempotency key
    const existing = await TransactionModel.findOne({
      'metadata.idempotencyKey': idempotencyKey,
      type: 'escrow_lock',
      status: { $in: ['pending', 'completed'] },
    });

    if (existing) {
      return serializeTransaction(existing);
    }

    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    if (job.status !== 'open') {
      throw new AppError('Job is not open for escrow lock', 400, 'JOB_NOT_OPEN');
    }

    const clientWallet = await WalletModel.findOne({ userId: job.client.clientId });
    if (!clientWallet) throw new AppError('Client wallet not found', 404, 'WALLET_NOT_FOUND');

    if (clientWallet.availableBalance < amountCents) {
      throw new AppError('Insufficient funds for escrow', 400, 'INSUFFICIENT_FUNDS');
    }

    const transactionId = generateTransactionId();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const clientWalletRef = await WalletModel.findById(clientWallet._id).session(session);
      if (!clientWalletRef) throw new AppError('Client wallet not found', 404, 'WALLET_NOT_FOUND');

      // Deduct from client's available balance, add to escrow
      clientWalletRef.balance -= amountCents;
      clientWalletRef.escrowBalance += amountCents;
      clientWalletRef.availableBalance = clientWalletRef.balance - clientWalletRef.escrowBalance;
      clientWalletRef.lastTransactionAt = new Date();
      await clientWalletRef.save({ session });

      // Create transaction record
      const transaction = await TransactionModel.create([{
        transactionId: generateTransactionId(),
        userId: clientWalletRef.userId,
        walletId: clientWalletRef._id,
        type: 'escrow_lock',
        status: 'completed',
        amount: -amountCents, // Negative from client perspective
        currency: 'USD',
        netAmount: -amountCents,
        feeAmount: 0,
        description: `Escrow locked for job ${job.title}`,
        metadata: {
          jobId,
          proposalId,
          idempotencyKey,
        },
        ledgerEntries: [],
        completedAt: new Date(),
      }], { session });

      // Create ledger entries
      await createLedgerEntries(session, transaction[0]._id, [{
        walletId: clientWalletRef._id,
        userId: clientWalletRef.userId.toString(),
        entryType: 'debit',
        amount: amountCents,
        description: `Escrow locked for job ${job.title}`,
        referenceId: job._id,
        referenceType: 'job',
      }]);

      transaction[0].ledgerEntries = [new mongoose.Types.ObjectId()]; // Placeholder
      await transaction[0].save({ session });

      // Update job with escrow info
      job.escrow = {
        lockedAmount: amountCents,
        lockedAt: new Date(),
        platformFeeAmount: Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100)),
        platformFeePercent: PLATFORM_FEE_PERCENT,
      };
      await job.save({ session });

      await session.commitTransaction();
      await session.endSession();

      return serializeTransaction(transaction[0]);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  },

  // Release escrow on job completion
  releaseEscrow: async (jobId: string, split: { providerAmount: number; platformFee: number; clientRefund: number }, idempotencyKey: string) => {
    const existing = await TransactionModel.findOne({
      'metadata.idempotencyKey': idempotencyKey,
      type: 'escrow_release',
      status: { $in: ['pending', 'completed'] },
    });

    if (existing) {
      return serializeTransaction(existing);
    }

    const job = await JobModel.findById(jobId)
      .populate('client.clientId')
      .populate('provider.providerId');
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    if (job.status !== 'in_progress' && job.status !== 'completed') {
      throw new AppError('Job is not in progress', 400, 'JOB_NOT_IN_PROGRESS');
    }

    if (!job.provider.providerId) {
      throw new AppError('No provider assigned to job', 400, 'NO_PROVIDER');
    }

    const clientWallet = await WalletModel.findOne({ userId: job.client.clientId._id });
    const providerWallet = await WalletModel.findOne({ userId: job.provider.providerId._id });

    if (!clientWallet) throw new AppError('Client wallet not found', 404, 'CLIENT_WALLET_NOT_FOUND');
    if (!providerWallet) throw new AppError('Provider wallet not found', 404, 'PROVIDER_WALLET_NOT_FOUND');

    const totalAmount = split.providerAmount + split.platformFee + split.clientRefund;

    const session = await mongoose.startSession();
    session.startTransaction();

try {
      // Client: release escrow balance, refund if any
      const clientWalletRef = await WalletModel.findById(clientWallet._id).session(session);
      clientWalletRef.escrowBalance -= (split.providerAmount + split.platformFee + split.clientRefund);
      clientWalletRef.balance += split.clientRefund;
      clientWalletRef.availableBalance = clientWalletRef.balance - clientWalletRef.escrowBalance;
      clientWalletRef.lastTransactionAt = new Date();
      await clientWalletRef.save({ session });

      // Provider: receive funds
      const providerWalletRef = await WalletModel.findById(providerWallet._id).session(session);
      providerWalletRef.balance += split.providerAmount;
      providerWalletRef.availableBalance = providerWalletRef.balance - providerWalletRef.escrowBalance;
      providerWalletRef.lastTransactionAt = new Date();
      await providerWalletRef.save({ session });

      // Platform: collect fee
      const platformWalletRef = await WalletModel.findById(platformWallet._id).session(session);
      platformWalletRef.balance += split.platformFee;
      platformWalletRef.availableBalance = platformWalletRef.balance - platformWalletRef.escrowBalance;
      platformWalletRef.lastTransactionAt = new Date();
      await platformWalletRef.save({ session });

      // Create ledger entries for all parties
      const ledgerEntries: Array<{
        walletId: mongoose.Types.ObjectId;
        userId: string;
        entryType: 'debit' | 'credit';
        amount: number;
        description: string;
        referenceId?: mongoose.Types.ObjectId;
        referenceType?: string;
      }> = [
        // Client: escrow released (debit from escrow)
        {
          walletId: clientWallet._id,
          userId: clientWallet.userId.toString(),
          entryType: 'debit',
          amount: split.providerAmount + split.platformFee,
          description: `Escrow released to provider`,
          referenceId: job._id,
          referenceType: 'job',
        },
      ];

      if (split.clientRefund > 0) {
        ledgerEntries.push({
          walletId: clientWallet._id,
          userId: clientWallet.userId.toString(),
          entryType: 'credit',
          amount: split.clientRefund,
          description: `Escrow refund to client`,
          referenceId: job._id,
          referenceType: 'job',
        });
      }

      ledgerEntries.push(
        // Provider: funds received
        {
          walletId: providerWallet._id,
          userId: providerWallet.userId.toString(),
          entryType: 'credit',
          amount: split.providerAmount,
          description: `Payment received for job`,
          referenceId: job._id,
          referenceType: 'job',
        },
        // Platform: fee collected
        {
          walletId: platformWalletRef._id,
          userId: '000000000000000000000000',
          entryType: 'credit',
          amount: split.platformFee,
          description: `Platform fee for job`,
          referenceId: job._id,
          referenceType: 'job',
        }
      );

      await createLedgerEntries(session, transaction[0]._id, ledgerEntries);

      // Update job escrow
      job.escrow.releasedAt = new Date();
      job.escrow.platformFeeAmount = split.platformFee;
      job.provider.startedAt = job.provider.startedAt || new Date();
      job.provider.completedAt = new Date();
      job.status = 'completed';
      await job.save({ session });

      await session.commitTransaction();
      await session.endSession();

      return { success: true, message: 'Escrow released successfully' };
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  },

  // Refund escrow to client (job cancelled/disputed)
  refundEscrow: async (jobId: string, amountCents: number, reason: string, idempotencyKey: string) => {
    const existing = await TransactionModel.findOne({
      'metadata.idempotencyKey': idempotencyKey,
      type: 'escrow_refund',
      status: { $in: ['pending', 'completed'] },
    });

    if (existing) {
      return serializeTransaction(existing);
    }

    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    const clientWallet = await WalletModel.findOne({ userId: job.client.clientId });
    if (!clientWallet) throw new AppError('Client wallet not found', 404, 'CLIENT_WALLET_NOT_FOUND');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const clientWalletRef = await WalletModel.findById(clientWallet._id).session(session);
      clientWalletRef.escrowBalance -= amountCents;
      clientWalletRef.balance += amountCents;
      clientWalletRef.availableBalance = clientWalletRef.balance - clientWalletRef.escrowBalance;
      clientWalletRef.lastTransactionAt = new Date();
      await clientWalletRef.save({ session });

      const transaction = await TransactionModel.create([{
        transactionId: generateTransactionId(),
        userId: clientWallet.userId,
        walletId: clientWallet._id,
        type: 'escrow_refund',
        status: 'completed',
        amount: amountCents,
        currency: 'USD',
        netAmount: amountCents,
        feeAmount: 0,
        description: `Escrow refunded: ${reason}`,
        metadata: { jobId, reason },
        completedAt: new Date(),
      }], { session });

      await session.commitTransaction();
      await session.endSession();

      return serializeTransaction(transaction[0]);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  },

  // Provider requests payout
  requestPayout: async (providerId: string, amountCents: number, currency: string = 'USD') => {
    const providerWallet = await WalletModel.findOne({ userId: providerId });
    if (!providerWallet) throw new AppError('Wallet not found', 404, 'WALLET_NOT_FOUND');

    if (providerWallet.availableBalance < amountCents) {
      throw new AppError('Insufficient available balance', 400, 'INSUFFICIENT_BALANCE');
    }

    const feeAmount = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
    const netAmount = amountCents - feeAmount;

    if (netAmount <= 0) {
      throw new AppError('Payout amount too small after fees', 400, 'INVALID_PAYOUT_AMOUNT');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const walletRef = await WalletModel.findById(providerWallet._id).session(session);
      walletRef.balance -= amountCents;
      walletRef.availableBalance = walletRef.balance - walletRef.escrowBalance;
      walletRef.lastTransactionAt = new Date();
      await walletRef.save({ session });

      const payout = await PayoutModel.create([{
        payoutId: generatePayoutId(),
        providerId,
        walletId: providerWallet._id,
        amount: amountCents,
        currency,
        netAmount,
        feeAmount,
        status: 'pending',
      }], { session });

      const transaction = await TransactionModel.create([{
        transactionId: generateTransactionId(),
        userId: providerId,
        walletId: providerWallet._id,
        type: 'payout',
        status: 'pending',
        amount: -amountCents,
        currency,
        netAmount: -netAmount,
        feeAmount,
        description: `Payout requested`,
        metadata: { payoutId: payout[0].payoutId },
      }], { session });

      await session.commitTransaction();
      await session.endSession();

      return serializePayout(payout[0]);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  },

  // Get wallet balance
  getBalance: async (userId: string) => {
    const wallet = await walletService.getWallet(userId);
    return {
      balance: wallet.balance,
      escrowBalance: wallet.escrowBalance,
      availableBalance: wallet.availableBalance,
      currency: wallet.currency,
    };
  },

  // Get transaction history
  getTransactionHistory: async (userId: string, options: {
    type?: TransactionType;
    status?: TransactionStatus;
    limit?: number;
    skip?: number;
  } = {}) => {
    const filter: any = { userId };
    if (options.type) filter.type = options.type;
    if (options.status) filter.status = options.status;

    const transactions = await TransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20)
      .lean();

    const total = await TransactionModel.countDocuments(filter);

    return {
      transactions: transactions.map(serializeTransaction),
      total,
    };
  },

  // Get wallet stats
  getWalletStats: async (userId: string) => {
    const wallet = await walletService.getWallet(userId);

    const stats = await TransactionModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);

    return {
      balance: wallet.balance,
      escrowBalance: wallet.escrowBalance,
      availableBalance: wallet.availableBalance,
      transactionStats: stats,
    };
  },

  // Admin: get all wallets
  getAllWallets: async (filter: { userId?: string; type?: string } = {}) => {
    const wallets = await WalletModel.find(filter).lean();
    return wallets.map(serializeWallet);
  },

  // Admin: manual adjustment
  adminAdjustment: async (userId: string, amountCents: number, type: 'credit' | 'debit', description: string, referenceId?: string, referenceType?: string) => {
    const wallet = await WalletModel.findOne({ userId });
    if (!wallet) throw new AppError('Wallet not found', 404, 'WALLET_NOT_FOUND');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const walletRef = await WalletModel.findById(wallet._id).session(session);
      const amount = Math.abs(amountCents);
      const entryType = type === 'credit' ? 'credit' : 'debit';

      if (entryType === 'debit' && walletRef.availableBalance < amount) {
        throw new AppError('Insufficient available balance', 400, 'INSUFFICIENT_BALANCE');
      }

      const balanceAfter = entryType === 'credit'
        ? walletRef.balance + amount
        : walletRef.balance - amount;

      walletRef.balance = balanceAfter;
      walletRef.availableBalance = walletRef.balance - walletRef.escrowBalance;
      walletRef.lastTransactionAt = new Date();
      await walletRef.save({ session });

      const transaction = await TransactionModel.create([{
        transactionId: generateTransactionId(),
        userId,
        walletId: wallet._id,
        type: 'adjustment',
        status: 'completed',
        amount: entryType === 'credit' ? amount : -amount,
        currency: 'USD',
        netAmount: entryType === 'credit' ? amount : -amount,
        feeAmount: 0,
        description: `Admin adjustment: ${description}`,
        metadata: { referenceId, referenceType },
        completedAt: new Date(),
      }], { session });

      await createLedgerEntries(session, transaction[0]._id, [{
        walletId: wallet._id,
        userId,
        entryType,
        amount,
        description: `Admin adjustment: ${description}`,
        referenceId: referenceId ? new mongoose.Types.ObjectId(referenceId) : undefined,
        referenceType,
      }]);

      await session.commitTransaction();
      await session.endSession();

      return serializeTransaction(transaction[0]);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  },
};
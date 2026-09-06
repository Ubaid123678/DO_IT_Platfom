import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { WalletModel } from './wallet.model.js';
import { TransactionModel, type ITransaction } from './wallet.model.js';
import { PayoutModel, type IPayout } from './wallet.model.js';
import { JobModel } from '../jobs/job.model.js';
import { wiseService } from './wise.service.js';
import { fxRateService } from './fx-rate.service.js';
import { stripeConnectService } from './stripe-connect.service.js';

interface PayoutScheduleOptions {
  providerId: string;
  amountCents: number;
  currency: string;
  destinationAccountId?: string;
  scheduleAt?: Date;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly';
  retryOnFailure?: boolean;
  maxRetries?: number;
}

interface ScheduledPayout {
  payoutId: string;
  providerId: string;
  amountCents: number;
  currency: string;
  destinationAccountId?: string;
  scheduledAt: Date;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  error?: string;
}

const generatePayoutId = () => `PAYOUT_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export const payoutSchedulerService = {
  // Schedule a payout for a provider
  schedulePayout: async (options: PayoutScheduleOptions): Promise<{ payoutId: string; scheduledAt: Date }> => {
    const providerWallet = await WalletModel.findOne({ userId: options.providerId });
    if (!providerWallet) throw new AppError('Provider wallet not found', 404, 'WALLET_NOT_FOUND');

    // Check available balance in the requested currency
    const availableBalance = await WalletModel.getAvailableBalance(options.providerId, options.currency);
    if (availableBalance < options.amountCents) {
      throw new AppError('Insufficient available balance', 400, 'INSUFFICIENT_BALANCE');
    }

    const payoutId = generatePayoutId();
    const scheduledAt = options.scheduleAt || new Date();

    // Create payout record with scheduled status
    const payout = await PayoutModel.create({
      payoutId,
      providerId: options.providerId,
      walletId: (await WalletModel.findOne({ userId: options.providerId }))?._id,
      amount: options.amountCents,
      currency: options.currency,
      netAmount: 0,
      feeAmount: 0,
      status: 'scheduled',
      destinationAccountId: options.destinationAccountId,
      metadata: {
        scheduledAt: scheduledAt.toISOString(),
        recurrence: options.recurrence,
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
      },
    });

    return { payoutId, scheduledAt };
  },

  // Process scheduled payouts (called by cron job)
  processScheduledPayouts: async (): Promise<number> => {
    const now = new Date();
    
    // Find all scheduled payouts that are due
    const scheduledPayouts = await PayoutModel.find({
      status: 'scheduled',
      'metadata.scheduledAt': { $lte: now.toISOString() },
    }).limit(50);

    let processedCount = 0;

    for (const payout of scheduledPayouts) {
      try {
        await payoutSchedulerService.processPayout(payout.payoutId);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process payout ${payout.payoutId}:`, error);
        // Error handling is done in processPayout
      }
    }

    return processedCount;
  },

  // Process a single payout
  processPayout: async (payoutId: string): Promise<void> => {
    const payout = await PayoutModel.findOne({ payoutId });
    if (!payout) throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');

    if (payout.status !== 'scheduled' && payout.status !== 'pending') {
      return; // Already processed or cancelled
    }

    // Update status to processing
    payout.status = 'processing';
    await payout.save();

    const providerWallet = await WalletModel.findById(payout.walletId);
    if (!providerWallet) throw new AppError('Provider wallet not found', 404, 'WALLET_NOT_FOUND');

    // Check if provider has Stripe Connect account
    const stripeAccount = await stripeConnectService.getAccount(payout.providerId.toString());
    if (!stripeAccount || !stripeAccount.charges_enabled || !stripeAccount.payouts_enabled) {
      throw new AppError('Provider Stripe Connect account not ready for payouts', 400, 'STRIPE_ACCOUNT_NOT_READY');
    }

    // Check available balance
    const availableBalance = await WalletModel.getAvailableBalance(payout.providerId.toString(), payout.currency);
    if (availableBalance < payout.amount) {
      throw new AppError('Insufficient balance at processing time', 400, 'INSUFFICIENT_BALANCE');
    }

    // Calculate platform fee
    const PLATFORM_FEE_PERCENT = 10;
    const feeAmount = Math.round(payout.amount * (PLATFORM_FEE_PERCENT / 100));
    const netAmount = payout.amount - feeAmount;

    if (netAmount <= 0) {
      throw new AppError('Payout amount too small after fees', 400, 'INVALID_PAYOUT_AMOUNT');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const providerWallet = await WalletModel.findById(payout.walletId);
      if (!providerWallet) throw new AppError('Provider wallet not found', 404, 'WALLET_NOT_FOUND');

      // Deduct from provider wallet
      const walletRef = await WalletModel.findById(providerWallet._id).session(session);
      walletRef.balance -= payout.amount;
      walletRef.availableBalances.set(payout.currency, (walletRef.availableBalances.get(payout.currency) || 0) - payout.amount);
      walletRef.lastTransactionAt = new Date();
      await walletRef.save({ session });

      // Create payout via Wise (for cross-border) or Stripe (domestic)
      let wiseTransferId: string | undefined;
      
      if (payout.currency !== 'USD' || payout.destinationAccountId) {
        // Use Wise for cross-border payouts
        const wiseQuote = await wiseService.createQuote({
          sourceCurrency: payout.currency,
          targetCurrency: payout.currency,
          sourceAmount: netAmount,
          profile: 1, // Default profile
        });

        const wiseTransfer = await wiseService.createTransfer({
          targetAccount: payout.destinationAccountId || 0, // Will need actual recipient ID
          quote: wiseQuote.id,
          reference: `payout_${payout.payoutId}`,
          customerTransactionId: payout.payoutId,
        });

        wiseTransferId = wiseTransfer.id;
      }

      // Update payout record
      payout.status = 'completed';
      payout.netAmount = netAmount;
      payout.feeAmount = feeAmount;
      payout.wiseTransferId = wiseTransferId;
      payout.completedAt = new Date();
      await payout.save({ session });

      // Create transaction record
      const transaction = await TransactionModel.create([{
        transactionId: generateTransactionId(),
        userId: payout.providerId,
        walletId: payout.walletId,
        type: 'payout',
        status: 'completed',
        amount: -payout.amount,
        currency: payout.currency,
        netAmount: -netAmount,
        feeAmount,
        description: `Payout to provider`,
        metadata: {
          payoutId: payout.payoutId,
          wiseTransferId,
          destinationAccountId: payout.destinationAccountId,
        },
        ledgerEntries: [],
        completedAt: new Date(),
      }], { session });

      // Create ledger entry
      await WalletModel.createLedgerEntries(session, transaction[0]._id, [{
        walletId: providerWallet._id,
        userId: payout.providerId.toString(),
        entryType: 'debit',
        amount: payout.amount,
        description: `Payout to provider`,
        referenceId: payout._id,
        referenceType: 'payout',
      }]);

      // Create platform fee ledger entry
      const platformWallet = await WalletModel.findOne({ type: 'platform' }).session(session);
      if (platformWallet) {
        platformWallet.balance += feeAmount;
        platformWallet.availableBalances.set(payout.currency, (platformWallet.availableBalances.get(payout.currency) || 0) + feeAmount);
        await platformWallet.save({ session });

        await TransactionModel.createLedgerEntries(session, transaction[0]._id, [{
          walletId: platformWallet._id,
          userId: '000000000000000000000000',
          entryType: 'credit',
          amount: feeAmount,
          description: `Platform fee for payout`,
          referenceId: payout._id,
          referenceType: 'payout',
        }]);
      }

      await session.commitTransaction();
      await session.endSession();

      // Trigger Wise transfer if cross-border
      if (wiseTransferId) {
        // Wise transfer was already created above
        // Could add webhook listener for completion
      }

    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      
      // Update payout with failure
      payout.status = 'failed';
      payout.failureReason = error instanceof Error ? error.message : 'Unknown error';
      payout.metadata.retryCount = (payout.metadata?.retryCount || 0) + 1;
      
      if ((payout.metadata?.retryCount || 0) < (payout.metadata?.maxRetries || 3)) {
        // Reschedule with exponential backoff
        const delayMs = Math.pow(2, payout.metadata.retryCount) * 60 * 60 * 1000; // 1h, 2h, 4h
        payout.metadata.scheduledAt = new Date(Date.now() + delayMs).toISOString();
        payout.status = 'scheduled';
      }
      
      await payout.save();
      throw error;
    }
  },

  // Retry failed payouts
  retryFailedPayouts: async (): Promise<number> => {
    const failedPayouts = await PayoutModel.find({
      status: 'failed',
      'metadata.retryCount': { $lt: 3 },
    }).limit(20);

    let retriedCount = 0;
    for (const payout of failedPayouts) {
      try {
        payout.status = 'scheduled';
        payout.metadata.scheduledAt = new Date().toISOString();
        await payout.save();
        retriedCount++;
      } catch (error) {
        console.error(`Failed to retry payout ${payout.payoutId}:`, error);
      }
    }
    return retriedCount;
  },

  // Cancel a scheduled payout
  cancelPayout: async (payoutId: string, reason: string): Promise<void> => {
    const payout = await PayoutModel.findOne({ payoutId });
    if (!payout) throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');
    if (payout.status === 'completed') {
      throw new AppError('Cannot cancel completed payout', 400, 'PAYOUT_ALREADY_COMPLETED');
    }
    payout.status = 'cancelled';
    payout.metadata.cancellationReason = reason;
    await payout.save();
  },

  // Get payout statistics for a provider
  getProviderPayoutStats: async (providerId: string): Promise<{
    totalPayouts: number;
    totalAmount: number;
    totalFees: number;
    pendingAmount: number;
    completedCount: number;
    failedCount: number;
  }> => {
    const stats = await PayoutModel.aggregate([
      { $match: { providerId: new mongoose.Types.ObjectId(providerId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$feeAmount' },
        },
      },
    ]);

    const result = {
      totalPayouts: 0,
      totalAmount: 0,
      totalFees: 0,
      pendingAmount: 0,
      completedCount: 0,
      failedCount: 0,
    };

    for (const stat of stats) {
      result.totalPayouts += stat.count;
      result.totalAmount += stat.totalAmount;
      result.totalFees += stat.totalFees || 0;

      if (stat._id === 'completed') {
        result.completedCount = stat.count;
      } else if (stat._id === 'failed') {
        result.failedCount = stat.count;
      } else if (stat._id === 'pending' || stat._id === 'scheduled') {
        result.pendingAmount += stat.totalAmount;
      }
    }

    return result;
  },
};
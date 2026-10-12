import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { PayoutModel } from './wallet.model.js';

// ponytail: scheduled/automatic payout processing (Bull queue + Wise transfer) was never
// wired to a cron/worker and referenced helpers that do not exist. Kept only the two
// operations the API actually uses. Add the scheduler back when a worker is introduced.

export const payoutSchedulerService = {
  // Cancel a scheduled payout
  cancelPayout: async (payoutId: string, reason: string): Promise<void> => {
    const payout = await PayoutModel.findOne({ payoutId });
    if (!payout) throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');
    if (payout.status === 'completed') {
      throw new AppError('Cannot cancel completed payout', 400, 'PAYOUT_ALREADY_COMPLETED');
    }
    payout.status = 'cancelled';
    payout.metadata = { ...payout.metadata, cancellationReason: reason };
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

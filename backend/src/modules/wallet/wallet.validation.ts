import Joi from 'joi';

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).required();
const transactionId = Joi.string().pattern(/^TXN_[A-Za-z0-9]{12,}$/).optional();
const payoutId = Joi.string().pattern(/^PAYOUT_[A-Za-z0-9]{12,}$/).optional();

export const walletValidators = {
  createTopUp: Joi.object({
    amountCents: Joi.number().integer().min(100).max(10000000).required().messages({
      'number.min': 'Minimum top-up amount is $1.00',
      'number.max': 'Maximum top-up amount is $100,000.00',
    }),
    currency: Joi.string().uppercase().min(3).max(3).default('USD'),
    paymentMethodId: Joi.string().optional(),
    idempotencyKey: Joi.string().min(16).max(64).required(),
  }),

  confirmTopUp: Joi.object({
    paymentIntentId: Joi.string().required(),
    paymentMethodId: Joi.string().optional(),
  }),

  requestPayout: Joi.object({
    amountCents: Joi.number().integer().min(100).required().messages({
      'number.min': 'Minimum payout amount is $1.00',
    }),
    currency: Joi.string().uppercase().min(3).max(3).default('USD'),
    destinationAccountId: Joi.string().optional(),
  }),

  getWallet: Joi.object({
    walletType: Joi.string().valid('user', 'escrow', 'fee').optional(),
  }),

  getTransactionHistory: Joi.object({
    type: Joi.string().valid(
      'topup', 'topup_reversal', 'escrow_lock', 'escrow_release',
      'escrow_refund', 'platform_fee', 'payout', 'payout_reversal',
      'adjustment', 'refund'
    ).optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    limit: Joi.number().integer().min(1).max(100).default(20),
    skip: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid('createdAt', 'amount', 'type').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  getLedgerEntries: Joi.object({
    walletId: objectId.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    skip: Joi.number().integer().min(0).default(0),
  }),

  requestPayoutByProvider: Joi.object({
    amountCents: Joi.number().integer().min(100).required(),
    currency: Joi.string().uppercase().min(3).max(3).default('USD'),
    wiseAccountId: Joi.string().optional(),
  }),

  adminAdjustment: Joi.object({
    userId: objectId,
    amountCents: Joi.number().integer().min(-1000000).max(1000000).required(),
    type: Joi.string().valid('credit', 'debit').required(),
    description: Joi.string().trim().min(5).max(500).required(),
    referenceId: objectId.optional(),
    referenceType: Joi.string().trim().max(50).optional(),
  }),

  stripeWebhook: Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    data: Joi.object().required(),
  }),

  escrowLock: Joi.object({
    jobId: objectId,
    proposalId: objectId,
    amountCents: Joi.number().integer().min(1).required(),
    idempotencyKey: Joi.string().min(16).max(64).required(),
  }),

  escrowRelease: Joi.object({
    jobId: objectId,
    amountCents: Joi.number().integer().min(1).required(),
    split: Joi.object({
      providerAmount: Joi.number().integer().min(0).required(),
      platformFee: Joi.number().integer().min(0).required(),
      clientRefund: Joi.number().integer().min(0).default(0),
    }).required(),
    idempotencyKey: Joi.string().min(16).max(64).required(),
  }),

  escrowRefund: Joi.object({
    jobId: objectId,
    amountCents: Joi.number().integer().min(1).required(),
    reason: Joi.string().trim().min(5).max(500).required(),
    idempotencyKey: Joi.string().min(16).max(64).required(),
  }),
};
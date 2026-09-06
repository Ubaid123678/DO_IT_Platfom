import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { walletService } from './wallet.service.js';
import { walletValidators } from './wallet.validation.js';
import { stripeService } from './stripe.service.js';

const validate = <T>(
  schema: { validate: (value: unknown) => { error?: { message: string }; value: T } },
  payload: unknown
): T => {
  const result = schema.validate(payload);
  if (result.error) throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  return result.value;
};

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.userId;
};

const getUserRole = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.role;
};

export const walletController = {
  // Get wallet balance
  getBalance: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const balance = await walletService.getBalance(userId);
    res.status(200).json({
      success: true,
      data: balance,
      meta: { message: 'Wallet balance fetched successfully' },
    });
  }),

  // Get wallet details
  getWallet: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const wallet = await walletService.getWallet(userId);
    res.status(200).json({
      success: true,
      data: wallet,
      meta: { message: 'Wallet fetched successfully' },
    });
  }),

  // Create top-up payment intent
  createTopUp: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(walletValidators.createTopUp, req.body);
    const result = await walletService.createTopUpIntent(
      userId,
      payload.amountCents,
      payload.currency,
      payload.idempotencyKey
    );
    res.status(201).json({
      success: true,
      data: result,
      meta: { message: 'Top-up payment intent created' },
    });
  }),

  // Confirm top-up (called after Stripe payment)
  confirmTopUp: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = validate(walletValidators.confirmTopUp, req.body);
    const transaction = await walletService.confirmTopUp(payload.paymentIntentId);
    res.status(200).json({
      success: true,
      data: transaction,
      meta: { message: 'Top-up confirmed successfully' },
    });
  }),

  // Stripe webhook handler
  stripeWebhook: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      throw new AppError('Stripe webhook secret not configured', 500, 'STRIPE_WEBHOOK_SECRET_MISSING');
    }

    let event;
    try {
      event = stripeService.verifyWebhookSignature(req.body, signature, endpointSecret);
    } catch (error) {
      throw new AppError('Webhook signature verification failed', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    await walletService.handleTopUpWebhook(event);

    res.status(200).json({ received: true });
  }),

  // Get transaction history
  getTransactionHistory: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(walletValidators.getTransactionHistory, req.query);
    const result = await walletService.getTransactionHistory(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Transaction history fetched successfully' },
    });
  }),

  // Get wallet stats
  getWalletStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const stats = await walletService.getWalletStats(userId);
    res.status(200).json({
      success: true,
      data: stats,
      meta: { message: 'Wallet statistics fetched successfully' },
    });
  }),

  // Request payout (provider only)
  requestPayout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    if (userRole !== 'provider') {
      throw new AppError('Only providers can request payouts', 403, 'PROVIDER_REQUIRED');
    }

    const payload = validate(walletValidators.requestPayoutByProvider, req.body);
    const payout = await walletService.requestPayout(userId, payload.amountCents, payload.currency);
    res.status(201).json({
      success: true,
      data: payout,
      meta: { message: 'Payout requested successfully' },
    });
  }),

  // Get payout history
  getPayoutHistory: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(walletValidators.getTransactionHistory, req.query);
    const result = await walletService.getPayoutHistory(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Payout history fetched successfully' },
    });
  }),

  // Admin endpoints
  adminGetAllWallets: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }

    const wallets = await walletService.getAllWallets({
      userId: req.query.userId as string,
      type: req.query.type as string,
    });

    res.status(200).json({
      success: true,
      data: { wallets },
      meta: { message: 'Wallets fetched successfully' },
    });
  }),

  adminAdjustment: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }

    const payload = validate(walletValidators.adminAdjustment, req.body);
    const transaction = await walletService.adminAdjustment(
      payload.userId,
      payload.amountCents,
      payload.type,
      payload.description,
      payload.referenceId,
      payload.referenceType
    );

    res.status(200).json({
      success: true,
      data: transaction,
      meta: { message: 'Adjustment completed successfully' },
    });
  }),

  // Internal endpoints (called by other services)
  internalLockEscrow: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // This is called internally by proposal service when proposal is accepted
    const payload = validate(walletValidators.escrowLock, req.body);
    const result = await walletService.lockEscrow(
      payload.jobId,
      payload.proposalId,
      payload.amountCents,
      payload.idempotencyKey
    );
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Escrow locked successfully' },
    });
  }),

  internalReleaseEscrow: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = validate(walletValidators.escrowRelease, req.body);
    const result = await walletService.releaseEscrow(
      payload.jobId,
      payload.split,
      payload.idempotencyKey
    );
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Escrow released successfully' },
    });
  }),

  internalRefundEscrow: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = validate(walletValidators.escrowRefund, req.body);
    const result = await walletService.refundEscrow(
      payload.jobId,
      payload.amountCents,
      payload.reason,
      payload.idempotencyKey
    );
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Escrow refunded successfully' },
    });
  }),
};
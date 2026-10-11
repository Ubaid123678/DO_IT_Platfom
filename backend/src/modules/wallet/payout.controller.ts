import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { walletService } from './wallet.service.js';
import { payoutSchedulerService } from './payout-scheduler.service.js';
import { wiseService } from './wise.service.js';
import { stripeConnectService } from './stripe-connect.service.js';
import { walletValidators } from './wallet.validation.js';

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

export const payoutController = {
  // Request a payout (provider only)
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
    // TODO: Implement pagination
    res.status(200).json({
      success: true,
      data: { payouts: [], total: 0 },
      meta: { message: 'Payout history fetched successfully' },
    });
  }),

  // Get payout statistics
  getPayoutStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    if (userRole !== 'provider') {
      throw new AppError('Only providers can view payout stats', 403, 'PROVIDER_REQUIRED');
    }

    const stats = await payoutSchedulerService.getProviderPayoutStats(userId);
    res.status(200).json({
      success: true,
      data: { stats },
      meta: { message: 'Payout statistics fetched successfully' },
    });
  }),

  // Cancel a scheduled payout
  cancelPayout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const { payoutId } = req.params;
    const { reason } = req.body;

    const payout = await PayoutModel.findOne({ payoutId });
    if (!payout) throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');

    if (payout.providerId.toString() !== userId) {
      throw new AppError('Not authorized to cancel this payout', 403, 'NOT_AUTHORIZED');
    }

    await payoutSchedulerService.cancelPayout(payoutId, reason);
    res.status(200).json({
      success: true,
      data: { success: true },
      meta: { message: 'Payout cancelled successfully' },
    });
  }),

  // Retry a failed payout
  retryPayout: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const { payoutId } = req.params;

    const payout = await PayoutModel.findOne({ payoutId });
    if (!payout) throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');

    if (payout.providerId.toString() !== userId) {
      throw new AppError('Not authorized to retry this payout', 403, 'NOT_AUTHORIZED');
    }

    if (payout.status !== 'failed') {
      throw new AppError('Only failed payouts can be retried', 400, 'INVALID_PAYOUT_STATUS');
    }

    // Reset status to scheduled for retry
    const { PayoutModel } = await import('./payout.model.js');
    await PayoutModel.findByIdAndUpdate(payout._id, {
      status: 'scheduled',
      'metadata.scheduledAt': new Date().toISOString(),
      'metadata.retryCount': 0,
    });

    res.status(200).json({
      success: true,
      data: { success: true },
      meta: { message: 'Payout scheduled for retry' },
    });
  }),

  // Stripe Connect onboarding
  createConnectAccount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    if (userRole !== 'provider') {
      throw new AppError('Only providers can create Stripe Connect accounts', 403, 'PROVIDER_REQUIRED');
    }

    const { country } = req.body;
    if (!country) {
      throw new AppError('Country is required', 400, 'VALIDATION_ERROR');
    }

    const account = await stripeConnectService.createExpressAccount(
      req.auth!.email,
      country,
      { userId }
    );

    res.status(201).json({
      success: true,
      data: { accountId: account.id },
      meta: { message: 'Stripe Connect account created' },
    });
  }),

  // Create account link for onboarding
  createAccountLink: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    if (userRole !== 'provider') {
      throw new AppError('Only providers can create account links', 403, 'PROVIDER_REQUIRED');
    }

    const { accountId, refreshUrl, returnUrl } = req.body;
    if (!accountId || !refreshUrl || !returnUrl) {
      throw new AppError('accountId, refreshUrl, and returnUrl are required', 400, 'VALIDATION_ERROR');
    }

    const link = await stripeConnectService.createAccountLink(accountId, refreshUrl, returnUrl);
    res.status(200).json({
      success: true,
      data: { url: link.url, expiresAt: new Date(link.expires_at * 1000) },
      meta: { message: 'Account link created' },
    });
  }),

  // Get Stripe Connect account status
  getConnectAccountStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    if (userRole !== 'provider') {
      throw new AppError('Only providers can view Connect account status', 403, 'PROVIDER_REQUIRED');
    }

    // Get account ID from user metadata or provider profile
    // For now, we'll require it in the request
    const { accountId } = req.query;
    if (!accountId) {
      throw new AppError('accountId is required', 400, 'VALIDATION_ERROR');
    }

    const account = await stripeConnectService.getAccount(accountId as string);
    const requirements = stripeConnectService.getAccountRequirements(account);

    res.status(200).json({
      success: true,
      data: {
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements,
        externalAccounts: account.external_accounts?.data || [],
      },
      meta: { message: 'Connect account status fetched' },
    });
  }),

  // Create login link for Connect dashboard
  createLoginLink: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    if (userRole !== 'provider') {
      throw new AppError('Only providers can create login links', 403, 'PROVIDER_REQUIRED');
    }

    const { accountId } = req.body;
    if (!accountId) {
      throw new AppError('accountId is required', 400, 'VALIDATION_ERROR');
    }

    const link = await stripeConnectService.createLoginLink(accountId);
    res.status(200).json({
      success: true,
      data: { url: link.url },
      meta: { message: 'Login link created' },
    });
  }),

  // Wise recipient management
  createWiseRecipient: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = req.body;
    // Validate and create recipient
    // This would use wiseService.createRecipient
    res.status(201).json({
      success: true,
      data: { recipient: {} },
      meta: { message: 'Wise recipient created' },
    });
  }),

  // Get Wise exchange rate
  getExchangeRate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { source, target } = req.query;
    if (!source || !target) {
      throw new AppError('source and target currencies are required', 400, 'VALIDATION_ERROR');
    }

    const { fxRateService } = await import('./fx-rate.service.js');
    const rate = await fxRateService.getRate(source as string, target as string);
    
    res.status(200).json({
      success: true,
      data: { rate, source, target, timestamp: new Date() },
      meta: { message: 'Exchange rate fetched' },
    });
  }),

  // Convert currency
  convertCurrency: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { amount, sourceCurrency, targetCurrency } = req.body;
    if (!amount || !sourceCurrency || !targetCurrency) {
      throw new AppError('amount, sourceCurrency, and targetCurrency are required', 400, 'VALIDATION_ERROR');
    }

    const { fxRateService } = await import('./fx-rate.service.js');
    const result = await fxRateService.convert(amount, sourceCurrency, targetCurrency);
    
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Currency converted' },
    });
  }),

  // Stripe webhook for Connect
  stripeConnectWebhook: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

    if (!endpointSecret) {
      throw new AppError('Stripe Connect webhook secret not configured', 500, 'STRIPE_WEBHOOK_SECRET_MISSING');
    }

    let event;
    try {
      event = stripeConnectService.verifyWebhookSignature(req.body, signature, endpointSecret);
    } catch (error) {
      throw new AppError('Webhook signature verification failed', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    // Handle Connect webhook events
    console.log('Stripe Connect webhook:', event.type);

    switch (event.type) {
      case 'account.updated':
        // Handle account updates (e.g., onboarding completion)
        console.log('Account updated:', event.data.object.id);
        break;
      case 'payout.paid':
        // Handle successful payout
        console.log('Payout paid:', event.data.object.id);
        break;
      case 'payout.failed':
        // Handle failed payout
        console.log('Payout failed:', event.data.object.id);
        break;
    }

    res.status(200).json({ received: true });
  }),

  // Wise webhook
  wiseWebhook: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const signature = req.headers['x-signature'] as string;
    const webhookSecret = process.env.WISE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new AppError('Wise webhook secret not configured', 500, 'WISE_WEBHOOK_SECRET_MISSING');
    }

    let event;
    try {
      event = wiseService.verifyWebhookSignature(JSON.stringify(req.body), signature, webhookSecret);
    } catch (error) {
      throw new AppError('Webhook signature verification failed', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    console.log('Wise webhook:', event.event_type, event.data.resource.id);

    // Handle transfer state changes
    if (event.event_type === 'transfers#state-change') {
      const transfer = event.data.resource;
      // Update payout status based on transfer state
      console.log(`Transfer ${transfer.id} status changed from ${event.data.previous_state} to ${event.data.current_state}`);
      
      // TODO: Update payout status in database
    }

    res.status(200).json({ received: true });
  }),

  // Get FX rates
  getFxRates: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { base, targets } = req.query;
    if (!base) {
      throw new AppError('base currency is required', 400, 'VALIDATION_ERROR');
    }

    const { fxRateService } = await import('./fx-rate.service.js');
    const targetList = (targets as string)?.split(',') || ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    const rates = await fxRateService.getMultipleRates(base as string, targetList);

    res.status(200).json({
      success: true,
      data: { base, rates, timestamp: new Date() },
      meta: { message: 'FX rates fetched' },
    });
  }),

  // Convert currency
  convertCurrency: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { amount, sourceCurrency, targetCurrency } = req.body;
    if (!amount || !sourceCurrency || !targetCurrency) {
      throw new AppError('amount, sourceCurrency, and targetCurrency are required', 400, 'VALIDATION_ERROR');
    }

    const { fxRateService } = await import('./fx-rate.service.js');
    const result = await fxRateService.convert(amount, sourceCurrency, targetCurrency);
    
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Currency converted' },
    });
  }),
};
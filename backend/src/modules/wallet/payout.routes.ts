import { Router } from 'express';
import { payoutController } from './payout.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Payout endpoints (provider only)
router.post('/payout', payoutController.requestPayout);
router.get('/payout/history', payoutController.getPayoutHistory);
router.get('/payout/stats', payoutController.getPayoutStats);
router.post('/payout/:payoutId/cancel', payoutController.cancelPayout);
router.post('/payout/:payoutId/retry', payoutController.retryPayout);

// Stripe Connect endpoints
router.post('/connect/account', payoutController.createConnectAccount);
router.post('/connect/account-link', payoutController.createAccountLink);
router.get('/connect/account-status', payoutController.getConnectAccountStatus);
router.post('/connect/login-link', payoutController.createLoginLink);

// Wise endpoints
router.post('/wise/recipient', payoutController.createWiseRecipient);
router.get('/wise/rate', payoutController.getExchangeRate);
router.post('/wise/convert', payoutController.convertCurrency);

// FX rates
router.get('/fx/rates', payoutController.getFxRates);
router.post('/fx/convert', payoutController.convertCurrency);

// Webhooks (no auth required for webhooks)
router.post('/webhook/stripe-connect', payoutController.stripeConnectWebhook);
router.post('/webhook/wise', payoutController.wiseWebhook);

export default router;
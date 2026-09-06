import { Router } from 'express';
import { walletController } from './wallet.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User wallet endpoints
router.get('/balance', walletController.getBalance);
router.get('/', walletController.getWallet);
router.get('/stats', walletController.getWalletStats);

// Top-up endpoints
router.post('/topup', walletController.createTopUp);
router.post('/topup/confirm', walletController.confirmTopUp);

// Stripe webhook (no auth required for webhook)
router.post('/webhook/stripe', walletController.stripeWebhook);

// Transaction history
router.get('/transactions', walletController.getTransactionHistory);

// Payout endpoints (provider only)
router.post('/payout', walletController.requestPayout);
router.get('/payouts', walletController.getPayoutHistory);

// Admin endpoints
router.get('/admin/wallets', walletController.adminGetAllWallets);
router.post('/admin/adjustment', walletController.adminAdjustment);

// Internal endpoints (for inter-service communication)
router.post('/internal/escrow/lock', walletController.internalLockEscrow);
router.post('/internal/escrow/release', walletController.internalReleaseEscrow);
router.post('/internal/escrow/refund', walletController.internalRefundEscrow);

export default router;
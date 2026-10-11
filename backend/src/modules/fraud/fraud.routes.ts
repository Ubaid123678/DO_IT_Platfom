import { Router } from 'express';
import { fraudController } from './fraud.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Fraud Rules (Admin)
router.post('/rules', fraudController.createFraudRule);
router.get('/rules', fraudController.getFraudRules);
router.get('/rules/:ruleId', fraudController.getFraudRuleById);
router.patch('/rules/:ruleId', fraudController.updateFraudRule);
router.delete('/rules/:ruleId', fraudController.deleteFraudRule);

// Fraud Flags
router.get('/flags', fraudController.getFraudFlags);
router.get('/flags/:flagId', fraudController.getFraudFlagById);
router.post('/flags/:flagId/evidence', fraudController.submitEvidence);

// Admin endpoints for fraud flags
router.post('/flags/:flagId/review', fraudController.reviewFraudFlag);
router.post('/flags/bulk-review', fraudController.bulkReviewFlags);

// Fraud Cases
router.get('/cases', fraudController.getFraudCases);
router.get('/cases/:caseId', fraudController.getFraudCaseById);
router.patch('/cases/:caseId', fraudController.updateFraudCase);
router.post('/cases/:caseId/resolve', fraudController.resolveFraudCase);

// Admin Actions
router.post('/actions/apply', fraudController.applyFraudAction);
router.post('/actions/block-ip', fraudController.blockIp);
router.post('/actions/block-device', fraudController.blockDevice);
router.post('/actions/lock-account', fraudController.lockAccount);
router.post('/actions/require-2fa', fraudController.require2fa);
router.post('/actions/notify-user', fraudController.notifyUser);
router.post('/actions/notify-admin', fraudController.notifyAdmin);

// Statistics
router.get('/stats', fraudController.getFraudStats);

// Admin bulk actions
router.post('/flags/bulk-review', fraudController.bulkReviewFlags);

// Export
router.get('/export', fraudController.exportFraudFlags);

export default router;
import { Router } from 'express';
import { disputeController } from './dispute.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User dispute endpoints
router.post('/', disputeController.createDispute);
router.get('/', disputeController.getDisputes);
router.get('/stats', disputeController.getDisputeStats);
router.get('/:disputeId', disputeController.getDisputeById);
router.post('/:disputeId/evidence', disputeController.submitEvidence);
router.post('/:disputeId/evidence/add', disputeController.addEvidence);

// Admin dispute endpoints
router.get('/admin', disputeController.getDisputesForAdmin);
router.get('/admin/:disputeId', disputeController.getDisputeByIdForAdmin);
router.post('/:disputeId/resolve', disputeController.resolveDispute);
router.post('/:disputeId/extend-deadline', disputeController.extendEvidenceDeadline);

export default router;
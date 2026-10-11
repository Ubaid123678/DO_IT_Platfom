import { Router } from 'express';
import { proposalController } from './proposal.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Provider: Submit a proposal for a job
router.post('/', proposalController.createProposal);

// Provider: Get my proposals
router.get('/my', proposalController.getProviderProposals);

// Client: Get proposals for a specific job (must be job owner)
router.get('/job/:jobId', proposalController.getProposalsForJob);

// Client: Get proposal statistics for a job
router.get('/job/:jobId/stats', proposalController.getJobProposalStats);

// Matching engine endpoints (client who owns the job or admin)
router.get('/job/:jobId/match', proposalController.findMatchingProviders);
router.post('/job/:jobId/auto-match', proposalController.autoMatchAndNotify);

// Get single proposal (provider who submitted or client who owns the job)
router.get('/:proposalId', proposalController.getProposalById);

// Client: Accept a proposal (auto-rejects others)
router.post('/:proposalId/accept', proposalController.acceptProposal);

// Client: Reject a proposal
router.post('/:proposalId/reject', proposalController.rejectProposal);

// Provider: Withdraw own proposal
router.post('/:proposalId/withdraw', proposalController.withdrawProposal);

export default router;
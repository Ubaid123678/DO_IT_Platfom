import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { proposalService } from './proposal.service.js';
import { matchingEngine } from './matching.service.js';
import { proposalValidators } from './proposal.validation.js';

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

export const proposalController = {
  createProposal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(proposalValidators.createProposal, req.body);
    const proposal = await proposalService.createProposal(userId, payload);
    res.status(201).json({
      success: true,
      data: { proposal },
      meta: { message: 'Proposal submitted successfully' },
    });
  }),

  getProposalById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const proposal = await proposalService.getProposalById(req.params.proposalId, userId);
    res.status(200).json({
      success: true,
      data: { proposal },
      meta: { message: 'Proposal fetched successfully' },
    });
  }),

  getProposalsForJob: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(proposalValidators.proposalQuery, req.query);
    const result = await proposalService.getProposalsForJob(req.params.jobId, userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Proposals fetched successfully' },
    });
  }),

  getProviderProposals: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(proposalValidators.proposalQuery, req.query);
    const result = await proposalService.getProviderProposals(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Provider proposals fetched successfully' },
    });
  }),

  getJobProposalStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const stats = await proposalService.getJobProposalStats(req.params.jobId, userId);
    res.status(200).json({
      success: true,
      data: { stats },
      meta: { message: 'Proposal statistics fetched successfully' },
    });
  }),

  acceptProposal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(proposalValidators.clientProposalAction, req.body);
    const proposal = await proposalService.acceptProposal(req.params.proposalId, userId, payload.message);
    res.status(200).json({
      success: true,
      data: { proposal },
      meta: { message: 'Proposal accepted successfully. Other proposals have been rejected.' },
    });
  }),

  rejectProposal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(proposalValidators.clientProposalAction, req.body);
    const proposal = await proposalService.rejectProposal(req.params.proposalId, userId, payload.message);
    res.status(200).json({
      success: true,
      data: { proposal },
      meta: { message: 'Proposal rejected successfully' },
    });
  }),

  withdrawProposal: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const proposal = await proposalService.withdrawProposal(req.params.proposalId, userId);
    res.status(200).json({
      success: true,
      data: { proposal },
      meta: { message: 'Proposal withdrawn successfully' },
    });
  }),

  // Matching engine endpoints
  findMatchingProviders: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    // Only client who owns the job or admin can trigger matching
    const jobId = req.params.jobId;
    const job = await import('../jobs/job.model.js').then(m => m.JobModel.findById(jobId));
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    
    if (userRole !== 'admin' && job.client.clientId.toString() !== userId) {
      throw new AppError('Not authorized to trigger matching for this job', 403, 'NOT_AUTHORIZED');
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const minRating = parseFloat(req.query.minRating as string) || 4.0;
    
    const result = await matchingEngine.findMatchingProviders({ jobId, limit, minRating });
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Matching providers found' },
    });
  }),

  autoMatchAndNotify: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    const jobId = req.params.jobId;
    const job = await import('../jobs/job.model.js').then(m => m.JobModel.findById(jobId));
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    
    if (userRole !== 'admin' && job.client.clientId.toString() !== userId) {
      throw new AppError('Not authorized to trigger matching for this job', 403, 'NOT_AUTHORIZED');
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const minRating = parseFloat(req.query.minRating as string) || 4.0;
    
    const result = await matchingEngine.autoMatchAndNotify(jobId, { limit, minRating });
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Matching completed and providers notified' },
    });
  }),
};
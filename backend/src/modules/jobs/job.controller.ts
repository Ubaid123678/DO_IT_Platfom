import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { jobService } from './job.service.js';
import { jobValidators } from './job.validation.js';

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

export const jobController = {
  createJob: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(jobValidators.createJob, req.body);
    const job = await jobService.createJob(userId, payload);
    res.status(201).json({
      success: true,
      data: { job },
      meta: { message: 'Job created successfully' },
    });
  }),

  getJobById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.userId;
    const job = await jobService.getJobById(req.params.jobId, userId);
    res.status(200).json({
      success: true,
      data: { job },
      meta: { message: 'Job fetched successfully' },
    });
  }),

  updateJob: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(jobValidators.updateJob, req.body);
    const job = await jobService.updateJob(req.params.jobId, userId, payload);
    res.status(200).json({
      success: true,
      data: { job },
      meta: { message: 'Job updated successfully' },
    });
  }),

  browseJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate(jobValidators.browseJobsQuery, req.query);
    const result = await jobService.browseJobs(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Jobs fetched successfully' },
    });
  }),

  getClientJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(jobValidators.clientJobQuery, req.query);
    const result = await jobService.getClientJobs(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Client jobs fetched successfully' },
    });
  }),

  getProviderJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(jobValidators.providerJobQuery, req.query);
    const result = await jobService.getProviderJobs(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Provider jobs fetched successfully' },
    });
  }),

  transitionStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    const payload = validate(jobValidators.jobStatusTransition, req.body);
    const job = await jobService.transitionStatus(req.params.jobId, userId, userRole, payload.status);
    res.status(200).json({
      success: true,
      data: { job },
      meta: { message: `Job status changed to ${payload.status}` },
    });
  }),

  assignProvider: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    // Only client who owns the job or admin can assign
    const job = await jobService.getJobById(req.params.jobId);
    if (job.client.clientId !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to assign provider', 403, 'NOT_AUTHORIZED');
    }

    const { providerId, proposalId } = req.body;
    if (!providerId || !proposalId) {
      throw new AppError('providerId and proposalId are required', 400, 'VALIDATION_ERROR');
    }

    const updatedJob = await jobService.assignProvider(req.params.jobId, providerId, proposalId);
    res.status(200).json({
      success: true,
      data: { job: updatedJob },
      meta: { message: 'Provider assigned successfully' },
    });
  }),

  deleteJob: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const result = await jobService.deleteJob(req.params.jobId, userId);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Job deleted successfully' },
    });
  }),

  getJobStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    const stats = await jobService.getJobStats(userId, userRole);
    res.status(200).json({
      success: true,
      data: { stats },
      meta: { message: 'Job statistics fetched successfully' },
    });
  }),

  searchJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate(jobValidators.browseJobsQuery, req.query);
    const result = await jobService.searchJobs(query.search || '', query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Search results fetched successfully' },
    });
  }),
};
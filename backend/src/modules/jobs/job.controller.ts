import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { jobService } from './job.service.js';
import { jobValidators } from './job.validation.js';
import type { IJobLocation, JobStatus, JobType } from './job.model.js';

const validate = <T>(
  schema: { validate: (value: unknown) => { error?: { message: string }; value: T } },
  payload: unknown
): T => {
  const result = schema.validate(payload) as { error?: { message: string }; value: T };
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

// Type-specific requirements validation
const validateRequirementsForType = (type: string, requirements: Record<string, unknown>) => {
  const errors: string[] = [];

  switch (type) {
    case 'physical': {
      if (requirements.yearsExperience !== undefined && (typeof requirements.yearsExperience !== 'number' || requirements.yearsExperience < 0 || requirements.yearsExperience > 100)) {
        errors.push('yearsExperience must be a number between 0 and 100');
      }
      if (requirements.serviceRadiusKm !== undefined && (typeof requirements.serviceRadiusKm !== 'number' || requirements.serviceRadiusKm < 1 || requirements.serviceRadiusKm > 500)) {
        errors.push('serviceRadiusKm must be a number between 1 and 500');
      }
      if (requirements.teamSize !== undefined && !['solo', 'with_helper', 'with_team'].includes(requirements.teamSize as string)) {
        errors.push('teamSize must be one of: solo, with_helper, with_team');
      }
      if (requirements.hasTransport !== undefined) {
        const ht = requirements.hasTransport as Record<string, unknown>;
        if (typeof ht.yes !== 'boolean') {
          errors.push('hasTransport.yes must be a boolean');
        }
        if (ht.mode !== undefined && !['bicycle', 'motorbike', 'car'].includes(ht.mode as string)) {
          errors.push('hasTransport.mode must be one of: bicycle, motorbike, car');
        }
      }
      break;
    }
    case 'digital': {
      if (requirements.englishProficiency !== undefined && !['basic', 'intermediate', 'fluent'].includes(requirements.englishProficiency as string)) {
        errors.push('englishProficiency must be one of: basic, intermediate, fluent');
      }
      if (requirements.workHistory !== undefined && Array.isArray(requirements.workHistory)) {
        requirements.workHistory.forEach((wh: Record<string, unknown>, i: number) => {
          if (!wh.title || !wh.company || !wh.start_date) {
            errors.push(`workHistory[${i}] requires title, company, and start_date`);
          }
        });
      }
      if (requirements.education !== undefined && Array.isArray(requirements.education)) {
        requirements.education.forEach((ed: Record<string, unknown>, i: number) => {
          if (!ed.institution || !ed.degree) {
            errors.push(`education[${i}] requires institution and degree`);
          }
        });
      }
      break;
    }
    case 'errand': {
      if (requirements.transportMode !== undefined && !['on_foot', 'bicycle', 'motorbike', 'car', 'van'].includes(requirements.transportMode as string)) {
        errors.push('transportMode must be one of: on_foot, bicycle, motorbike, car, van');
      }
      if (requirements.baseFee !== undefined && (typeof requirements.baseFee !== 'number' || requirements.baseFee < 0 || requirements.baseFee > 1000000)) {
        errors.push('baseFee must be a number between 0 and 1000000');
      }
      if (requirements.perKmFee !== undefined && (typeof requirements.perKmFee !== 'number' || requirements.perKmFee < 0 || requirements.perKmFee > 100000)) {
        errors.push('perKmFee must be a number between 0 and 100000');
      }
      if (requirements.maxPayloadKg !== undefined && (typeof requirements.maxPayloadKg !== 'number' || requirements.maxPayloadKg < 0 || requirements.maxPayloadKg > 1000)) {
        errors.push('maxPayloadKg must be a number between 0 and 1000');
      }
      break;
    }
  }

  if (errors.length > 0) {
    throw new AppError(errors.join('; '), 400, 'VALIDATION_ERROR');
  }
};

type CreateJobPayload = {
  title: string;
  description: string;
  type: JobType;
  location: IJobLocation | null;
  budget: {
    type: 'fixed' | 'hourly';
    amount: number;
    currency: string;
    hourlyRate?: number;
    estimatedHours?: number;
  };
  schedule: {
    startsAt?: Date;
    endsAt?: Date;
    timezone: string;
    isFlexible: boolean;
    preferredDays?: string[];
    preferredShifts?: string[];
  };
  requirements: Record<string, unknown>;
  metadata?: {
    tags?: string[];
    isUrgent?: boolean;
  };
};

export const jobController = {
  createJob: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(jobValidators.createJob, req.body) as CreateJobPayload;
    
    validateRequirementsForType(payload.type, payload.requirements);
    
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
    const payload = validate(jobValidators.updateJob, req.body) as Record<string, unknown>;
    const job = await jobService.updateJob(req.params.jobId, userId, payload);
    res.status(200).json({
      success: true,
      data: { job },
      meta: { message: 'Job updated successfully' },
    });
  }),

  browseJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate(jobValidators.browseJobsQuery, req.query) as Record<string, unknown>;
    const result = await jobService.browseJobs(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Jobs fetched successfully' },
    });
  }),

  getClientJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(jobValidators.clientJobQuery, req.query) as Record<string, unknown>;
    const result = await jobService.getClientJobs(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Client jobs fetched successfully' },
    });
  }),

  getProviderJobs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(jobValidators.providerJobQuery, req.query) as Record<string, unknown>;
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
    const payload = validate(jobValidators.jobStatusTransition, req.body) as { status: JobStatus };
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
    const query = validate(jobValidators.browseJobsQuery, req.query) as { search?: string } & Record<string, unknown>;
    const result = await jobService.searchJobs(query.search || '', query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Search results fetched successfully' },
    });
  }),
};
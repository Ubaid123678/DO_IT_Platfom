import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { JobModel, type IJob, type JobStatus, type JobType } from './job.model.js';
import UserModel from '../auth/auth.model.js';
import { SkillCategoryModel } from '../verification/verification.model.js';

interface BrowseJobsOptions {
  type?: JobType;
  category?: string;
  skillItem?: string;
  status?: JobStatus;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: 'fixed' | 'hourly';
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  city?: string;
  experienceLevel?: 'entry' | 'intermediate' | 'expert';
  isUrgent?: boolean;
  isFeatured?: boolean;
  sortBy?: 'createdAt' | 'budget' | 'distance' | 'urgency';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
  search?: string;
}

interface BrowseResult {
  jobs: IJob[];
  total: number;
  limit: number;
  skip: number;
}

const PLATFORM_FEE_PERCENT = 10; // 10%

const serializeJob = (job: any) => {
  const obj = job.toJSON?.() ?? job;
  return obj;
};

const serializeJobList = (jobs: any[]) => jobs.map(serializeJob);

export const jobService = {
  createJob: async (
    clientId: string,
    input: {
      title: string;
      description: string;
      type: JobType;
      location: {
        coordinates: [number, number];
        address?: string;
        city?: string;
        country?: string;
        formattedAddress?: string;
      };
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
      requirements: {
        categories: string[];
        skillItems?: string[];
        experienceLevel?: 'entry' | 'intermediate' | 'expert';
        languages?: string[];
        certificationsRequired?: boolean;
        vehicleRequired?: boolean;
      };
      metadata?: {
        tags?: string[];
        isUrgent?: boolean;
      };
    }
  ) => {
    const client = await UserModel.findById(clientId);
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    if (client.role !== 'client') throw new AppError('Only clients can create jobs', 403, 'CLIENT_REQUIRED');

    // Validate categories exist
    const categories = await SkillCategoryModel.find({ _id: { $in: input.requirements.categories } });
    if (categories.length !== input.requirements.categories.length) {
      throw new AppError('One or more categories not found', 400, 'INVALID_CATEGORY');
    }

    // Validate skill items belong to selected categories
    if (input.requirements.skillItems && input.requirements.skillItems.length > 0) {
      // We need to check against SkillItem model, but we'll skip this validation for now
    }

    const job = await JobModel.create({
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'open',
      location: {
        type: 'Point',
        coordinates: input.location.coordinates,
        address: input.location.address,
        city: input.location.city,
        country: input.location.country,
        formattedAddress: input.location.formattedAddress,
      },
      budget: {
        type: input.budget.type,
        amount: input.budget.amount,
        currency: input.budget.currency || 'USD',
        hourlyRate: input.budget.hourlyRate,
        estimatedHours: input.budget.estimatedHours,
      },
      schedule: {
        startsAt: input.schedule.startsAt,
        endsAt: input.schedule.endsAt,
        timezone: input.schedule.timezone,
        isFlexible: input.schedule.isFlexible,
        preferredDays: input.schedule.preferredDays,
        preferredShifts: input.schedule.preferredShifts,
      },
      requirements: {
        categories: input.requirements.categories,
        skillItems: input.requirements.skillItems || [],
        experienceLevel: input.requirements.experienceLevel,
        languages: input.requirements.languages,
        certificationsRequired: input.requirements.certificationsRequired,
        vehicleRequired: input.requirements.vehicleRequired,
      },
      client: {
        clientId: client._id,
        clientName: client.fullName,
        clientAvatar: client.provider_profile?.avatar_url,
      },
      provider: {},
      escrow: {
        lockedAmount: 0,
        platformFeeAmount: 0,
        platformFeePercent: PLATFORM_FEE_PERCENT,
      },
      dispute: {},
      review: {},
      metadata: {
        views: 0,
        applicationsCount: 0,
        source: 'app',
        tags: input.metadata?.tags || [],
        isUrgent: input.metadata?.isUrgent || false,
        isFeatured: false,
      },
    });

    return serializeJob(job);
  },

  getJobById: async (jobId: string, userId?: string) => {
    const job = await JobModel.findById(jobId)
      .populate('requirements.categories', 'name job_type icon_url')
      .populate('requirements.skillItems', 'name requires_certificate requires_vehicle')
      .lean();

    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    // Increment view count (fire and forget)
    JobModel.updateOne({ _id: jobId }, { $inc: { 'metadata.views': 1 } }).exec();

    const serialized = serializeJob(job);

    // Add computed fields for the client
    if (userId) {
      serialized.isOwner = serialized.client.clientId === userId;
      serialized.isAssignedProvider = serialized.provider.providerId === userId;
    }

    return serialized;
  },

  updateJob: async (jobId: string, clientId: string, updateData: Record<string, unknown>) => {
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    if (job.client.clientId.toString() !== clientId) {
      throw new AppError('Not authorized to update this job', 403, 'NOT_AUTHORIZED');
    }

    if (job.status !== 'open') {
      throw new AppError('Can only update open jobs', 400, 'JOB_NOT_OPENABLE');
    }

    // Apply updates
    Object.assign(job, updateData);
    await job.save();

    return serializeJob(job);
  },

  browseJobs: async (options: BrowseJobsOptions): Promise<BrowseResult> => {
    const {
      type,
      category,
      skillItem,
      status = 'open',
      minBudget,
      maxBudget,
      budgetType,
      latitude,
      longitude,
      radiusKm = 50,
      city,
      experienceLevel,
      isUrgent,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      skip = 0,
      search,
    } = options;

    const filter: Record<string, unknown> = { status };

    if (type) filter.type = type;
    if (category) filter['requirements.categories'] = category;
    if (skillItem) filter['requirements.skillItems'] = skillItem;
    if (experienceLevel) filter['requirements.experienceLevel'] = experienceLevel;
    if (isUrgent !== undefined) filter['metadata.isUrgent'] = isUrgent;
    if (isFeatured !== undefined) filter['metadata.isFeatured'] = isFeatured;
    if (budgetType) filter['budget.type'] = budgetType;

    // Budget range
    if (minBudget !== undefined || maxBudget !== undefined) {
      filter['budget.amount'] = {};
      if (minBudget !== undefined) (filter['budget.amount'] as Record<string, number>).$gte = minBudget;
      if (maxBudget !== undefined) (filter['budget.amount'] as Record<string, number>).$lte = maxBudget;
    }

    // Geo query
    if (latitude !== undefined && longitude !== undefined) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      };
    } else if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    let sort: Record<string, 1 | -1> = {};
    const order = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'distance' && latitude !== undefined && longitude !== undefined) {
      sort = { 'metadata.distance': order };
    } else if (sortBy === 'budget') {
      sort = { 'budget.amount': order };
    } else if (sortBy === 'urgency') {
      sort = { 'metadata.isUrgent': -1, createdAt: -1 };
    } else {
      sort = { [sortBy]: order };
    }

    const [jobs, total] = await Promise.all([
      JobModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('requirements.categories', 'name job_type icon_url')
        .populate('requirements.skillItems', 'name requires_certificate requires_vehicle')
        .lean(),
      JobModel.countDocuments(filter),
    ]);

    return {
      jobs: serializeJobList(jobs),
      total,
      limit,
      skip,
    };
  },

  getClientJobs: async (clientId: string, options: {
    status?: JobStatus;
    sortBy?: 'createdAt' | 'updatedAt' | 'status';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    skip?: number;
  }) => {
    const filter: Record<string, unknown> = { 'client.clientId': clientId };
    if (options.status) filter.status = options.status;

    const sort: Record<string, 1 | -1> = {};
    const order = options.sortOrder === 'asc' ? 1 : -1;
    sort[options.sortBy || 'createdAt'] = order;

    const [jobs, total] = await Promise.all([
      JobModel.find(filter)
        .sort(sort)
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('requirements.categories', 'name job_type icon_url')
        .populate('requirements.skillItems', 'name')
        .lean(),
      JobModel.countDocuments(filter),
    ]);

    return {
      jobs: serializeJobList(jobs),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  getProviderJobs: async (providerId: string, options: {
    status?: JobStatus;
    type?: JobType;
    sortBy?: 'createdAt' | 'budget' | 'distance';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    skip?: number;
  }) => {
    const filter: Record<string, unknown> = { 'provider.providerId': providerId };
    if (options.status) filter.status = options.status;
    if (options.type) filter.type = options.type;

    const sort: Record<string, 1 | -1> = {};
    const order = options.sortOrder === 'asc' ? 1 : -1;
    sort[options.sortBy || 'createdAt'] = order;

    const [jobs, total] = await Promise.all([
      JobModel.find(filter)
        .sort(sort)
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('requirements.categories', 'name job_type icon_url')
        .populate('requirements.skillItems', 'name')
        .lean(),
      JobModel.countDocuments(filter),
    ]);

    return {
      jobs: serializeJobList(jobs),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  transitionStatus: async (
    jobId: string,
    userId: string,
    userRole: string,
    newStatus: JobStatus
  ) => {
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    // Use the document's method
    const transition = (job as any).canTransitionTo(newStatus, userId, userRole);
    if (!transition.allowed) {
      throw new AppError(transition.reason || 'Invalid status transition', 400, 'INVALID_TRANSITION');
    }

    job.status = newStatus;

    // Handle side effects based on transition
    const now = new Date();

    switch (newStatus) {
      case 'in_progress':
        if (!job.provider.providerId) {
          throw new AppError('No provider assigned to start job', 400, 'NO_PROVIDER');
        }
        job.provider.startedAt = now;
        break;
      case 'completed':
        job.provider.completedAt = now;
        // Release escrow will be handled by wallet service
        break;
      case 'cancelled':
        // Handle refund logic via wallet service
        break;
      case 'disputed':
        job.dispute = {
          raisedBy: userRole === 'client' ? 'client' : 'provider',
          raisedAt: now,
          status: 'open',
        };
        break;
    }

    await job.save();
    return serializeJob(job);
  },

  assignProvider: async (jobId: string, providerId: string, proposalId: string) => {
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    if (job.status !== 'open') {
      throw new AppError('Job is not open for assignment', 400, 'JOB_NOT_OPEN');
    }

    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new AppError('Invalid provider', 400, 'INVALID_PROVIDER');
    }

    job.provider = {
      providerId: provider._id,
      providerName: provider.fullName,
      providerAvatar: provider.provider_profile?.avatar_url,
      acceptedProposalId: new mongoose.Types.ObjectId(proposalId),
    };
    job.status = 'in_progress';
    job.provider.startedAt = new Date();

    await job.save();
    return serializeJob(job);
  },

  incrementApplications: async (jobId: string) => {
    await JobModel.updateOne({ _id: jobId }, { $inc: { 'metadata.applicationsCount': 1 } });
  },

  deleteJob: async (jobId: string, clientId: string) => {
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    if (job.client.clientId.toString() !== clientId) {
      throw new AppError('Not authorized to delete this job', 403, 'NOT_AUTHORIZED');
    }

    if (job.status !== 'open' && job.status !== 'cancelled') {
      throw new AppError('Can only delete open or cancelled jobs', 400, 'JOB_NOT_DELETABLE');
    }

    await job.deleteOne();
    return { success: true, message: 'Job deleted successfully' };
  },

  getJobStats: async (userId: string, userRole: string) => {
    const match: Record<string, unknown> = {};

    if (userRole === 'client') {
      match['client.clientId'] = userId;
    } else if (userRole === 'provider') {
      match['provider.providerId'] = userId;
    }

    const stats = await JobModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<JobStatus, number> = {
      open: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0,
      resolved: 0,
    };

    for (const stat of stats) {
      if (stat._id in result) {
        result[stat._id as JobStatus] = stat.count;
      }
    }

    return result;
  },

  searchJobs: async (query: string, filters: Partial<BrowseJobsOptions> = {}) => {
    return jobService.browseJobs({
      ...filters,
      search: query,
      status: filters.status || 'open',
    });
  },
};
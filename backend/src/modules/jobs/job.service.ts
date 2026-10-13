import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError.js';
import { JobModel, type IJob, type IJobLocation, type JobStatus, type JobType } from './job.model.js';
import UserModel from '../auth/auth.model.js';
import { SkillCategoryModel } from '../verification/verification.model.js';
import { walletService } from '../wallet/wallet.service.js';

interface BrowseJobsOptions {
  type?: JobType;
  category?: string;
  categories?: string[];
  skillItem?: string;
  skillItems?: string[];
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
  // When set, only return jobs whose category (and optionally skill) is in the
  // provider's verified set. `true` = match any of categories/skillItems.
  matchAnyOfVerified?: boolean;
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
  // Mongoose .lean() does not apply the `{}` defaults for these subdocuments,
  // so jobs with no provider (etc.) come back with the key missing entirely.
  // Normalize here so every caller can rely on them existing.
  return {
    ...obj,
    provider: obj.provider ?? {},
    escrow: obj.escrow ?? {},
    dispute: obj.dispute ?? {},
    review: obj.review ?? {},
  };
};

const serializeJobList = (jobs: any[]) => jobs.map(serializeJob);

export const jobService = {
  createJob: async (
    clientId: string,
    input: {
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
    }
  ) => {
    const client = await UserModel.findById(clientId);
    if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    if (client.role !== 'client') throw new AppError('Only clients can create jobs', 403, 'CLIENT_REQUIRED');

    // Extract base requirements for validation
    const baseRequirements = {
      categories: input.requirements.categories as string[],
      skillItems: input.requirements.skillItems as string[] | undefined,
      experienceLevel: input.requirements.experienceLevel as string | undefined,
      languages: input.requirements.languages as string[] | undefined,
      certificationsRequired: input.requirements.certificationsRequired as boolean | undefined,
      vehicleRequired: input.requirements.vehicleRequired as boolean | undefined,
    };

    // Validate categories exist
    const categories = await SkillCategoryModel.find({ _id: { $in: baseRequirements.categories } });
    if (categories.length !== baseRequirements.categories.length) {
      throw new AppError('One or more categories not found', 400, 'INVALID_CATEGORY');
    }

    // Validate skill items belong to selected categories
    if (baseRequirements.skillItems && baseRequirements.skillItems.length > 0) {
      // We need to check against SkillItem model, but we'll skip this validation for now
    }

    // Handle location for different job types
    let locationData: any;
    
    if (input.type === 'digital') {
      // Digital jobs are remote: no address. Only set coordinates; omitting the
      // optional address/city/country avoids the `country` minlength-2 validator
      // rejecting an empty string (which surfaced as a 500).
      locationData = {
        type: 'Point' as const,
        coordinates: [0, 0] as [number, number],
      };
    } else if (input.type === 'errand') {
      // Errand jobs have pickup and delivery locations
      const loc = input.location!;
      locationData = {
        type: 'Point' as const,
        coordinates: loc.coordinates || [0, 0],
        address: loc.address || undefined,
        city: loc.city || undefined,
        country: loc.country || undefined,
        formattedAddress: loc.formattedAddress || undefined,
        pickupLocation: loc.pickupLocation ? {
          type: 'Point' as const,
          coordinates: loc.pickupLocation.coordinates,
          address: loc.pickupLocation.address || undefined,
          city: loc.pickupLocation.city || undefined,
          country: loc.pickupLocation.country || undefined,
          formattedAddress: loc.pickupLocation.formattedAddress || undefined,
        } : undefined,
        deliveryLocation: loc.deliveryLocation ? {
          type: 'Point' as const,
          coordinates: loc.deliveryLocation.coordinates,
          address: loc.deliveryLocation.address || undefined,
          city: loc.deliveryLocation.city || undefined,
          country: loc.deliveryLocation.country || undefined,
          formattedAddress: loc.deliveryLocation.formattedAddress || undefined,
        } : undefined,
      };
    } else {
      // Physical jobs - single location
      const loc = input.location!;
      locationData = {
        type: 'Point' as const,
        coordinates: loc.coordinates,
        address: loc.address || undefined,
        city: loc.city || undefined,
        country: loc.country || undefined,
        formattedAddress: loc.formattedAddress || undefined,
      };
    }

    const job = await JobModel.create({
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'open',
      location: locationData,
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
      // Store all requirements including type-specific fields
      requirements: input.requirements,
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

    // Add computed fields for the client. Compare stringified ids — lean()
    // returns ObjectIds, and ObjectId !== string would always be false.
    if (userId) {
      const clientId = serialized.client?.clientId;
      const providerId = serialized.provider?.providerId;
      serialized.isOwner = clientId != null && clientId.toString() === userId;
      serialized.isAssignedProvider = providerId != null && providerId.toString() === userId;
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
      categories,
      skillItem,
      skillItems,
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
      matchAnyOfVerified,
    } = options;

    const filter: Record<string, unknown> = { status };

    if (type) filter.type = type;
    // Multi-value matching: a job is relevant if its categories include any of
    // the provider's verified categories ($in), optionally narrowed by skills.
    const categoryList = categories && categories.length > 0 ? categories : category ? [category] : [];
    const skillList = skillItems && skillItems.length > 0 ? skillItems : skillItem ? [skillItem] : [];

    if (matchAnyOfVerified && (categoryList.length > 0 || skillList.length > 0)) {
      // Relevant = shares a category OR a skill with the provider's verified set.
      const or: Record<string, unknown>[] = [];
      if (categoryList.length > 0) or.push({ 'requirements.categories': { $in: categoryList } });
      if (skillList.length > 0) or.push({ 'requirements.skillItems': { $in: skillList } });
      filter.$or = or;
    } else {
      if (categoryList.length > 0) filter['requirements.categories'] = { $in: categoryList };
      if (skillList.length > 0) filter['requirements.skillItems'] = { $in: skillList };
    }
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

    // Geo query - only for physical/errand jobs (digital jobs are remote)
    if (type !== 'digital' && latitude !== undefined && longitude !== undefined) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      };
    } else if (type !== 'digital' && city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    // Text search. Uses regex (not $text) so it searches title *and* description
    // and can coexist with a $near geo filter — MongoDB rejects $text + $near
    // in the same query. Regex is unindexed; move to Atlas Search if volume grows.
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    // Build sort. When a $near query is active Mongo already returns nearest-first,
    // so we only set an explicit sort when the caller asked for a real field.
    let sort: Record<string, 1 | -1> = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    const hasGeo = type !== 'digital' && latitude !== undefined && longitude !== undefined;

    if (sortBy === 'distance') {
      // Distance ordering comes from the $near query itself; with no geo there is
      // no distance to sort by, so fall back to newest.
      sort = hasGeo ? {} : { createdAt: -1 };
    } else if (sortBy === 'budget') {
      sort = { 'budget.amount': order };
    } else if (sortBy === 'urgency') {
      sort = { 'metadata.isUrgent': -1, createdAt: -1 };
    } else {
      sort = { [sortBy]: order };
    }

    const query = JobModel.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('requirements.categories', 'name job_type icon_url')
      .populate('requirements.skillItems', 'name requires_certificate requires_vehicle')
      .lean();

    if (Object.keys(sort).length > 0) query.sort(sort);

    // countDocuments does not accept $near, so mirror the geo filter with
    // $geoWithin (same circle) for the count.
    const countFilter: Record<string, unknown> = { ...filter };
    if (hasGeo) {
      countFilter.location = {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], (radiusKm * 1000) / 6378100],
        },
      };
    }

    const [jobs, total] = await Promise.all([
      query,
      JobModel.countDocuments(countFilter),
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
        // Release escrow via wallet service
        const lockedAmount = job.escrow?.lockedAmount || 0;
        const platformFee = job.escrow?.platformFeeAmount || Math.round(lockedAmount * 0.1);
        const providerAmount = lockedAmount - platformFee;
        const clientRefund = 0; // Can be extended for partial refunds

        await walletService.releaseEscrow(
          jobId,
          {
            providerAmount,
            platformFee,
            clientRefund,
          },
          `escrow_release_${jobId}_${Date.now()}`
        );
        break;
      case 'cancelled':
        // Refund escrow to client
        if (job.escrow?.lockedAmount && job.escrow.lockedAmount > 0) {
          await walletService.refundEscrow(
            jobId,
            job.escrow.lockedAmount,
            'Job cancelled',
            `escrow_refund_${jobId}_${Date.now()}`
          );
        }
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
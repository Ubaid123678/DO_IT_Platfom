import { AppError } from '../../common/errors/AppError.js';
import { ProposalModel, type IProposal, type ProposalStatus } from './proposal.model.js';
import { JobModel } from '../jobs/job.model.js';
import UserModel from '../auth/auth.model.js';
import { jobService as JobService } from '../jobs/job.service.js';

const serializeProposal = (proposal: any) => {
  const obj = proposal.toJSON?.() ?? proposal;
  return obj;
};

const serializeProposalList = (proposals: any[]) => proposals.map(serializeProposal);

interface ProposalListOptions {
  status?: ProposalStatus;
  jobId?: string;
  sortBy?: 'createdAt' | 'bidAmount' | 'submittedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

interface ProposalListResult {
  proposals: IProposal[];
  total: number;
  limit: number;
  skip: number;
}

export const proposalService = {
  createProposal: async (
    providerId: string,
    input: {
      jobId: string;
      bidAmount: number;
      bidType: 'fixed' | 'hourly';
      hourlyRate?: number;
      estimatedHours?: number;
      coverLetter: string;
      estimatedTimeline: string;
    }
  ) => {
    // Check if provider already has a proposal for this job
    const existing = await ProposalModel.findOne({ jobId: input.jobId, providerId });
    if (existing) {
      throw new AppError('You have already submitted a proposal for this job', 409, 'PROPOSAL_EXISTS');
    }

    // Verify job exists and is open
    const job = await JobModel.findById(input.jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.status !== 'open') {
      throw new AppError('Job is not open for proposals', 400, 'JOB_NOT_OPEN');
    }

    // Verify provider exists and is a provider
    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new AppError('Only providers can submit proposals', 403, 'PROVIDER_REQUIRED');
    }

    // Check if provider is verified for the job's category
    const isVerifiedForCategory = job.requirements.categories.some(
      (catId) => provider.categories_selected?.includes(catId.toString())
    );
    if (!isVerifiedForCategory) {
      throw new AppError('You are not verified for this job category', 403, 'NOT_VERIFIED_FOR_CATEGORY');
    }

    const proposal = await ProposalModel.create({
      jobId: input.jobId,
      providerId,
      clientId: job.client.clientId,
      bidAmount: input.bidAmount,
      bidType: input.bidType,
      hourlyRate: input.hourlyRate,
      estimatedHours: input.estimatedHours,
      coverLetter: input.coverLetter,
      estimatedTimeline: input.estimatedTimeline,
      status: 'submitted',
      submittedAt: new Date(),
    });

    // Increment job applications count
    await JobModel.updateOne({ _id: input.jobId }, { $inc: { 'metadata.applicationsCount': 1 } });

    return serializeProposal(proposal);
  },

  getProposalById: async (proposalId: string, userId: string) => {
    const proposal = await ProposalModel.findById(proposalId)
      .populate('jobId', 'title type status location budget')
      .populate('providerId', 'fullName provider_profile.avatar_url')
      .populate('clientId', 'fullName')
      .lean();

    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    // Check authorization: only provider who submitted, client who owns the job, or admin
    const isProvider = proposal.providerId.toString() === userId;
    const isClient = proposal.clientId.toString() === userId;
    // We'd need to check role for admin - simplified for now

    if (!isProvider && !isClient) {
      throw new AppError('Not authorized to view this proposal', 403, 'NOT_AUTHORIZED');
    }

    return serializeProposal(proposal);
  },

  getProposalsForJob: async (jobId: string, clientId: string, options: ProposalListOptions = {}): Promise<ProposalListResult> => {
    // Verify job belongs to client
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.client.clientId.toString() !== clientId) {
      throw new AppError('Not authorized to view proposals for this job', 403, 'NOT_AUTHORIZED');
    }

    const filter: Record<string, unknown> = { jobId };
    if (options.status) filter.status = options.status;

    const sort: Record<string, 1 | -1> = {};
    const order = options.sortOrder === 'asc' ? 1 : -1;
    sort[options.sortBy || 'submittedAt'] = order;

    const [proposals, total] = await Promise.all([
      ProposalModel.find(filter)
        .sort(sort)
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('providerId', 'fullName provider_profile.avatar_url provider_profile.headline provider_profile.bio provider_profile.city verification_status')
        .lean(),
      ProposalModel.countDocuments(filter),
    ]);

    return {
      proposals: serializeProposalList(proposals),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  getProviderProposals: async (providerId: string, options: ProposalListOptions = {}): Promise<ProposalListResult> => {
    const filter: Record<string, unknown> = { providerId };
    if (options.status) filter.status = options.status;
    if (options.jobId) filter.jobId = options.jobId;

    const sort: Record<string, 1 | -1> = {};
    const order = options.sortOrder === 'asc' ? 1 : -1;
    sort[options.sortBy || 'submittedAt'] = order;

    const [proposals, total] = await Promise.all([
      ProposalModel.find(filter)
        .sort(sort)
        .skip(options.skip || 0)
        .limit(options.limit || 20)
        .populate('jobId', 'title type status location budget client')
        .lean(),
      ProposalModel.countDocuments(filter),
    ]);

    return {
      proposals: serializeProposalList(proposals),
      total,
      limit: options.limit || 20,
      skip: options.skip || 0,
    };
  },

  acceptProposal: async (proposalId: string, clientId: string, message?: string) => {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    // Verify client owns the job
    const job = await JobModel.findById(proposal.jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.client.clientId.toString() !== clientId) {
      throw new AppError('Not authorized to accept proposals for this job', 403, 'NOT_AUTHORIZED');
    }

    if (proposal.status !== 'submitted') {
      throw new AppError('Proposal cannot be accepted', 400, 'PROPOSAL_NOT_ACCEPTABLE');
    }

    if (job.status !== 'open') {
      throw new AppError('Job is not open for assignment', 400, 'JOB_NOT_OPEN');
    }

    // Accept the proposal
    await proposal.accept(clientId, message);

    // Assign provider to job and transition to in_progress
    await JobService.assignProvider(proposal.jobId.toString(), proposal.providerId.toString(), proposal._id.toString());

    // Reject all other submitted proposals for this job
    await ProposalModel.updateMany(
      { jobId: proposal.jobId, status: 'submitted', _id: { $ne: proposal._id } },
      { status: 'rejected', rejectedAt: new Date(), respondedAt: new Date() }
    );

    return serializeProposal(proposal);
  },

  rejectProposal: async (proposalId: string, clientId: string, message?: string) => {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    // Verify client owns the job
    const job = await JobModel.findById(proposal.jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.client.clientId.toString() !== clientId) {
      throw new AppError('Not authorized to reject proposals for this job', 403, 'NOT_AUTHORIZED');
    }

    if (proposal.status !== 'submitted') {
      throw new AppError('Proposal cannot be rejected', 400, 'PROPOSAL_NOT_REJECTABLE');
    }

    await proposal.reject(clientId, message);

    return serializeProposal(proposal);
  },

  withdrawProposal: async (proposalId: string, providerId: string) => {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    if (proposal.providerId.toString() !== providerId) {
      throw new AppError('Not authorized to withdraw this proposal', 403, 'NOT_AUTHORIZED');
    }

    if (!proposal.canBeWithdrawn()) {
      throw new AppError('Proposal cannot be withdrawn', 400, 'PROPOSAL_NOT_WITHDRAWABLE');
    }

    await proposal.withdraw();

    // Decrement job applications count
    await JobModel.updateOne({ _id: proposal.jobId }, { $inc: { 'metadata.applicationsCount': -1 } });

    return serializeProposal(proposal);
  },

  getJobProposalStats: async (jobId: string, clientId: string) => {
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    if (job.client.clientId.toString() !== clientId) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    const stats = await ProposalModel.aggregate([
      { $match: { jobId: job._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgBid: { $avg: '$bidAmount' },
          minBid: { $min: '$bidAmount' },
          maxBid: { $max: '$bidAmount' },
        },
      },
    ]);

    const result: Record<ProposalStatus, { count: number; avgBid?: number; minBid?: number; maxBid?: number }> = {
      submitted: { count: 0 },
      withdrawn: { count: 0 },
      accepted: { count: 0 },
      rejected: { count: 0 },
      expired: { count: 0 },
    };

    for (const stat of stats) {
      if (stat._id in result) {
        result[stat._id as ProposalStatus] = {
          count: stat.count,
          avgBid: stat.avgBid,
          minBid: stat.minBid,
          maxBid: stat.maxBid,
        };
      }
    }

    return result;
  },

  expireOldProposals: async () => {
    // Expire proposals for jobs that are no longer open
    const result = await ProposalModel.updateMany(
      {
        status: 'submitted',
        jobId: { $in: await JobModel.find({ status: { $ne: 'open' } }).distinct('_id') },
      },
      { status: 'expired' }
    );
    return result.modifiedCount;
  },
};
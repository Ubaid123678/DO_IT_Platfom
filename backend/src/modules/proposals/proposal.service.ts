import { AppError } from '../../common/errors/AppError.js';
import { ProposalModel, type IProposal, type ProposalStatus } from './proposal.model.js';
import { JobModel } from '../jobs/job.model.js';
import UserModel from '../auth/auth.model.js';
import { jobService as JobService } from '../jobs/job.service.js';
import { walletService } from '../wallet/wallet.service.js';
import { messagingService } from '../messaging/messaging.service.js';

// Proposal events notify in-app only (no email/push creds needed). A
// notification failure must never fail the money/state op that just succeeded,
// so it is fire-and-forget.
const safeNotify = (input: {
  userId: string;
  type: 'proposal_received' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_withdrawn';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  relatedEntityId?: string;
}) => {
  void messagingService
    .sendNotification({ ...input, channels: ['in_app'] })
    .catch(() => undefined);
};

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

    // A provider may apply when they share the job's category OR any of its
    // skill items. This must match the "relevant" browse feed exactly, or the
    // provider sees a job they can't actually apply to.
    const providerCategoryIds = (provider.categories_selected ?? []).map(String);
    const providerSkillIds = (provider.skill_items_selected ?? []).map(String);
    const jobCategoryIds = job.requirements.categories.map(String);
    const jobSkillIds = (job.requirements.skillItems ?? []).map(String);

    const sharesCategory = jobCategoryIds.some((catId) => providerCategoryIds.includes(catId));
    const sharesSkill = jobSkillIds.some((skillId) => providerSkillIds.includes(skillId));

    if (!sharesCategory && !sharesSkill) {
      throw new AppError(
        'You are not verified for this job. Select its category or a required skill first.',
        403,
        'NOT_VERIFIED_FOR_JOB',
      );
    }

    // Server computes the hourly total. Never trust client-side money math:
    // the client controls hourlyRate/estimatedHours but not bidAmount for
    // hourly bids (a 0-amount hourly bid would escrow $0).
    let bidAmount = input.bidAmount;
    if (input.bidType === 'hourly') {
      bidAmount = Math.round((input.hourlyRate ?? 0) * (input.estimatedHours ?? 0));
      if (bidAmount <= 0) {
        throw new AppError('Hourly rate and estimated hours must be greater than zero', 400, 'INVALID_BID');
      }
    }

    const proposal = await ProposalModel.create({
      jobId: input.jobId,
      providerId,
      clientId: job.client.clientId,
      bidAmount,
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

    safeNotify({
      userId: job.client.clientId.toString(),
      type: 'proposal_received',
      title: 'New proposal received',
      body: `You have a new proposal on "${job.title}".`,
      data: { jobId: input.jobId, proposalId: proposal._id.toString() },
      relatedEntityId: proposal._id.toString(),
    });

    return serializeProposal(proposal);
  },

  getProposalById: async (proposalId: string, userId: string) => {
    const proposal = await ProposalModel.findById(proposalId)
      .populate('jobId', 'title type status location budget')
      .populate('providerId', 'fullName provider_profile.avatar_url')
      .populate('clientId', 'fullName')
      .lean();

    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    // Check authorization: only the provider who submitted or the client who
    // owns the job (or admin) may view. providerId/clientId are populated into
    // objects, so read `_id` — calling .toString() on the object gave
    // "[object Object]" and always failed.
    const providerId = String((proposal.providerId as any)?._id ?? proposal.providerId);
    const clientId = String((proposal.clientId as any)?._id ?? proposal.clientId);
    const isProvider = providerId === userId;
    const isClient = clientId === userId;

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

    // Atomically claim the job. The conditional update is the mutex: two
    // concurrent accepts (or an accept racing a withdraw) cannot both pass,
    // because only one findAndUpdate matches status:'open'.
    const claimed = await JobModel.findOneAndUpdate(
      { _id: job._id, status: 'open' },
      { $set: { status: 'in_progress' } },
      { new: true }
    );
    if (!claimed) throw new AppError('Job is not open for assignment', 400, 'JOB_NOT_OPEN');

    try {
      // Deterministic idempotency key: retries after a lost response must be
      // no-ops, not a second escrow lock. (Date.now() made every call unique.)
      const idempotencyKey = `escrow_lock_${proposal._id}`;

      await walletService.lockEscrow(
        job._id.toString(),
        proposal._id.toString(),
        proposal.bidAmount,
        idempotencyKey
      );

      await proposal.accept(clientId, message);

      await JobService.assignProvider(proposal.jobId.toString(), proposal.providerId.toString(), proposal._id.toString());

      // Reject all other submitted proposals for this job
      await ProposalModel.updateMany(
        { jobId: proposal.jobId, status: 'submitted', _id: { $ne: proposal._id } },
        { status: 'rejected', rejectedAt: new Date(), respondedAt: new Date() }
      );
    } catch (err) {
      // Best-effort rollback: reopen the job so the client can pick another
      // proposal. lockEscrow refunds on its own failure; if it succeeded and a
      // later step failed, refund here (keyed to the same deterministic id).
      try {
        await walletService.refundEscrow(
          job._id.toString(),
          proposal.bidAmount,
          'Proposal acceptance failed',
          `escrow_lock_${proposal._id}`
        );
      } catch { /* escrow may not have locked; nothing to refund */ }
      await JobModel.updateOne({ _id: job._id, status: 'in_progress' }, { $set: { status: 'open' } });
      throw err;
    }

    safeNotify({
      userId: proposal.providerId.toString(),
      type: 'proposal_accepted',
      title: 'Your proposal was accepted',
      body: `Your proposal for "${job.title}" was accepted. Escrow is funded.`,
      data: { jobId: proposal.jobId.toString(), proposalId: proposal._id.toString() },
      relatedEntityId: proposal._id.toString(),
    });

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

    safeNotify({
      userId: proposal.providerId.toString(),
      type: 'proposal_rejected',
      title: 'Proposal update',
      body: `Your proposal for "${job.title}" was not selected.`,
      data: { jobId: proposal.jobId.toString(), proposalId: proposal._id.toString() },
      relatedEntityId: proposal._id.toString(),
    });

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

    const job = await JobModel.findById(proposal.jobId).select('title client.clientId');

    await proposal.withdraw();

    if (job) {
      safeNotify({
        userId: job.client.clientId.toString(),
        type: 'proposal_withdrawn',
        title: 'Proposal withdrawn',
        body: `A provider withdrew their proposal on "${job.title}".`,
        data: { jobId: proposal.jobId.toString(), proposalId: proposal._id.toString() },
        relatedEntityId: proposal._id.toString(),
      });
    }

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
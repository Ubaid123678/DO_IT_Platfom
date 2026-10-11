import { AppError } from '../../common/errors/AppError.js';
import { DisputeModel, type IDispute, type DisputeStatus, type DisputeRaisedBy, type IVerdict } from './dispute.model.js';
import { JobModel } from '../jobs/job.model.js';
import { ProposalModel } from '../proposals/proposal.model.js';
import { walletService } from '../wallet/wallet.service.js';
import mongoose from 'mongoose';

const EVIDENCE_PERIOD_DAYS = 7; // days to submit evidence after dispute opened

const serializeDispute = (dispute: IDispute) => {
  const obj = dispute.toJSON?.() ?? dispute;
  return obj;
};

const serializeDisputeList = (disputes: IDispute[]) => disputes.map(serializeDispute);

interface CreateDisputeInput {
  jobId: string;
  proposalId: string;
  raisedBy: DisputeRaisedBy;
  raisedByUserId: string;
  reason: string;
  description?: string;
}

interface SubmitEvidenceInput {
  disputeId: string;
  userId: string;
  evidence: {
    type: 'document' | 'image' | 'video' | 'text' | 'link';
    url?: string;
    content?: string;
    description?: string;
  }[];
}

interface ResolveDisputeInput {
  disputeId: string;
  adminId: string;
  verdict: 'client_wins' | 'provider_wins' | 'split';
  resolution: 'escrow_to_client' | 'escrow_to_provider' | 'escrow_split' | 'escrow_refunded';
  reasoning?: string;
  splitPercentage?: number; // for split verdict
  adminNotes?: string;
}

interface ExtendDeadlineInput {
  disputeId: string;
  days: number;
}

export const disputeService = {
  createDispute: async (input: CreateDisputeInput) => {
    const { jobId, proposalId, raisedBy, raisedByUserId, reason, description } = input;

    // Verify job and proposal exist
    const job = await JobModel.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) throw new AppError('Proposal not found', 404, 'PROPOSAL_NOT_FOUND');

    // Verify proposal belongs to the job
    if (proposal.jobId.toString() !== jobId) {
      throw new AppError('Proposal does not belong to this job', 400, 'PROPOSAL_JOB_MISMATCH');
    }

    // Verify job is in a state where disputes can be raised
    if (!['in_progress', 'completed'].includes(job.status)) {
      throw new AppError('Disputes can only be raised for in-progress or completed jobs', 400, 'INVALID_JOB_STATUS');
    }

    // Verify the user is part of this job
    const isClient = job.client.clientId.toString() === raisedByUserId;
    const isProvider = job.provider.providerId?.toString() === raisedByUserId;
    if (!isClient && !isProvider) {
      throw new AppError('Only job participants can raise disputes', 403, 'NOT_JOB_PARTICIPANT');
    }

    // Check if dispute already exists for this job
    const existingDispute = await DisputeModel.findOne({ jobId, status: { $ne: 'closed' } });
    if (existingDispute) {
      throw new AppError('An active dispute already exists for this job', 409, 'DISPUTE_EXISTS');
    }

    // Determine the against user
    const againstUserId = isClient ? job.provider.providerId : job.client.clientId;

    // Calculate evidence deadline
    const evidenceDeadline = new Date();
    evidenceDeadline.setDate(evidenceDeadline.getDate() + 7); // 7 days from now

    const dispute = await DisputeModel.create({
      jobId,
      proposalId,
      raisedBy,
      raisedByUserId,
      againstUserId,
      reason,
      description,
      status: 'open',
      evidence: [],
      openedAt: new Date(),
      evidenceDeadline: new Date(Date.now() + EVIDENCE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
    });

    // Update job to mark it has a dispute
    job.dispute = {
      disputeId: dispute._id,
      status: 'open',
      raisedAt: new Date(),
    };
    await job.save();

    return serializeDispute(dispute);
  },

  submitEvidence: async (input: SubmitEvidenceInput) => {
    const { disputeId, userId, evidence } = input;

    const dispute = await DisputeModel.findById(disputeId);
    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');

    // Verify user is part of this dispute
    const isParticipant = 
      dispute.raisedByUserId.toString() === userId || 
      dispute.againstUserId.toString() === userId;
    
    if (!isParticipant) {
      throw new AppError('You cannot submit evidence for this dispute', 403, 'CANNOT_SUBMIT_EVIDENCE');
    }

    // Check if evidence can be submitted
    if (dispute.status !== 'open' && dispute.status !== 'evidence_submitted') {
      throw new AppError('You cannot submit evidence for this dispute', 403, 'CANNOT_SUBMIT_EVIDENCE');
    }
    
    if (new Date() > dispute.evidenceDeadline) {
      throw new AppError('Evidence deadline has passed', 403, 'EVIDENCE_DEADLINE_PASSED');
    }

    // Add evidence
    const newEvidence = evidence.map(e => ({
      ...e,
      submittedBy: new mongoose.Types.ObjectId(userId),
      submittedAt: new Date(),
    }));

    dispute.evidence.push(...newEvidence);
    dispute.status = 'evidence_submitted';
    await dispute.save();

    return serializeDispute(dispute);
  },

  getDisputeById: async (disputeId: string, userId: string) => {
    const dispute = await DisputeModel.findById(disputeId)
      .populate('jobId', 'title status client provider')
      .populate('proposalId', 'title bidAmount')
      .populate('raisedByUserId', 'fullName')
      .populate('againstUserId', 'fullName')
      .populate('evidence.submittedBy', 'fullName')
      .populate('verdict.decidedBy', 'fullName')
      .lean();

    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');

    // Verify user is part of this dispute
    const isParticipant = 
      dispute.raisedByUserId.toString() === userId || 
      dispute.againstUserId.toString() === userId;

    if (!isParticipant) {
      // Check if user is admin - would need role check
      throw new AppError('Not authorized to view this dispute', 403, 'NOT_AUTHORIZED');
    }

    return serializeDispute(dispute);
  },

  getDisputes: async (userId: string, options: {
    status?: 'open' | 'evidence_submitted' | 'under_review' | 'resolved' | 'closed';
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'openedAt' | 'evidenceDeadline';
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const filter: any = {
      $or: [{ raisedByUserId: userId }, { againstUserId: userId }],
    };
    if (options.status) filter.status = options.status;

    const sort: Record<string, 1 | -1> = {};
    sort[options.sortBy || 'createdAt'] = options.sortOrder === 'asc' ? 1 : -1;

    const skip = ((options.page || 1) - 1) * (options.limit || 20);
    const limit = options.limit || 20;

    const [disputes, total] = await Promise.all([
      DisputeModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('jobId', 'title status')
        .populate('proposalId', 'title')
        .populate('raisedByUserId', 'fullName')
        .populate('againstUserId', 'fullName')
        .lean(),
      DisputeModel.countDocuments(filter),
    ]);

    return {
      disputes: serializeDisputeList(disputes),
      total,
      limit: options.limit || 20,
      skip,
    };
  },

  getDisputesForAdmin: async (options: {
    status?: 'open' | 'evidence_submitted' | 'under_review' | 'resolved' | 'closed';
    page?: number;
    limit?: number;
  } = {}) => {
    const filter: any = {};
    if (options.status) filter.status = options.status;

    const skip = ((options.page || 1) - 1) * (options.limit || 20);
    const limit = options.limit || 20;

    const [disputes, total] = await Promise.all([
      DisputeModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('jobId', 'title status client provider')
        .populate('raisedByUserId', 'fullName email')
        .populate('againstUserId', 'fullName email')
        .lean(),
      DisputeModel.countDocuments(filter),
    ]);

    return {
      disputes: serializeDisputeList(disputes),
      total,
      limit: options.limit || 20,
      skip,
    };
  },

  resolveDispute: async (input: ResolveDisputeInput) => {
    const { disputeId, adminId, verdict, resolution, reasoning, splitPercentage, adminNotes } = input;

    const dispute = await DisputeModel.findById(disputeId);
    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');

    // Check if dispute can be resolved by admin
    const canAdminResolve = ['evidence_submitted', 'under_review'].includes(dispute.status);
    if (!canAdminResolve) {
      throw new AppError('Dispute cannot be resolved at this stage', 400, 'DISPUTE_NOT_RESOLVABLE');
    }

    // Validate split percentage for split verdict
    if (verdict === 'split' && (splitPercentage === undefined || splitPercentage < 0 || splitPercentage > 100)) {
      throw new AppError('Split percentage must be between 0 and 100 for split verdict', 400, 'INVALID_SPLIT_PERCENTAGE');
    }

    const verdictObj: IVerdict = {
      verdict,
      resolution,
      decidedBy: new mongoose.Types.ObjectId(adminId),
      decidedAt: new Date(),
      reasoning,
      splitPercentage: verdict === 'split' ? splitPercentage : undefined,
    };

    dispute.verdict = verdictObj;
    dispute.status = 'resolved';
    dispute.resolvedAt = new Date();
    if (adminNotes) dispute.adminNotes = adminNotes;
    await dispute.save();

    // Route escrow based on verdict
    await routeEscrowByVerdict(dispute, verdictObj);

    return serializeDispute(dispute);
  },

  extendEvidenceDeadline: async (input: ExtendDeadlineInput) => {
    const { disputeId, days } = input;

    const dispute = await DisputeModel.findById(disputeId);
    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new AppError('Cannot extend deadline for resolved/closed dispute', 400, 'DISPUTE_CLOSED');
    }

    const newDeadline = new Date(dispute.evidenceDeadline);
    newDeadline.setDate(newDeadline.getDate() + days);
    dispute.evidenceDeadline = newDeadline;
    await dispute.save();

    return serializeDispute(dispute);
  },

  getDisputeStats: async (userId: string) => {
    const stats = await DisputeModel.aggregate([
      { $match: { $or: [{ raisedByUserId: new mongoose.Types.ObjectId(userId) }, { againstUserId: new mongoose.Types.ObjectId(userId) }] } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<DisputeStatus, number> = {
      open: 0,
      evidence_submitted: 0,
      under_review: 0,
      resolved: 0,
      closed: 0,
    };

    for (const stat of stats) {
      if (stat._id in result) {
        result[stat._id as DisputeStatus] = stat.count;
      }
    }

    return result;
  },
};

// Route escrow based on verdict
const routeEscrowByVerdict = async (dispute: IDispute, verdict: IVerdict) => {
  const job = await JobModel.findById(dispute.jobId);
  if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

  if (!job.escrow || !job.escrow.lockedAmount) {
    throw new AppError('No escrow found for this job', 400, 'NO_ESCROW');
  }

  const lockedAmount = job.escrow.lockedAmount;
  const platformFee = job.escrow.platformFeeAmount || 0;

  switch (verdict.resolution) {
    case 'escrow_to_client':
      // Refund full escrow to client
      await walletService.refundEscrow(
        dispute.jobId.toString(),
        lockedAmount,
        `Dispute resolved in favor of client: ${verdict.reasoning}`,
        `dispute_refund_${dispute._id}_${Date.now()}`
      );
      break;

    case 'escrow_to_provider':
      // Release escrow to provider (minus platform fee)
      await walletService.releaseEscrow(
        dispute.jobId.toString(),
        {
          providerAmount: lockedAmount - platformFee,
          platformFee,
          clientRefund: 0,
        },
        `dispute_release_${dispute._id}_${Date.now()}`
      );
      break;

    case 'escrow_split':
      // Split escrow between client and provider
      const clientPercentage = dispute.verdict?.splitPercentage || 50;
      const providerAmount = Math.round(lockedAmount * (clientPercentage / 100));
      const clientRefund = lockedAmount - providerAmount - platformFee;

      await walletService.releaseEscrow(
        dispute.jobId.toString(),
        {
          providerAmount,
          platformFee,
          clientRefund: Math.max(0, clientRefund),
        },
        `dispute_split_${dispute._id}_${Date.now()}`
      );
      break;

    case 'escrow_refunded':
      // Full refund to client
      await walletService.refundEscrow(
        dispute.jobId.toString(),
        lockedAmount,
        `Dispute resolved: escrow refunded to client`,
        `dispute_refund_${dispute._id}_${Date.now()}`
      );
      break;
  }

  // Update job dispute status
  job.dispute.status = 'resolved';
  job.dispute.resolvedAt = new Date();
  // Map DisputeResolution to IJobDispute resolution type
  const resolutionMap: Record<string, 'client_wins' | 'provider_wins' | 'split'> = {
    'escrow_to_client': 'client_wins',
    'escrow_to_provider': 'provider_wins',
    'escrow_split': 'split',
    'escrow_refunded': 'client_wins',
  };
  job.dispute.resolution = resolutionMap[verdict.resolution] || 'client_wins';
  await job.save();
};
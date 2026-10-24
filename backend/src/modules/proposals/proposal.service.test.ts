import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockedProposalCreate,
  mockedProposalFindById,
  mockedJobFindById,
  mockedJobFindOneAndUpdate,
  mockedUserFindById,
  mockedLockEscrow,
  mockedRefundEscrow,
  mockedSendNotification,
} = vi.hoisted(() => ({
  mockedProposalCreate: vi.fn(),
  mockedProposalFindById: vi.fn(),
  mockedJobFindById: vi.fn(),
  mockedJobFindOneAndUpdate: vi.fn(),
  mockedUserFindById: vi.fn(),
  mockedLockEscrow: vi.fn().mockResolvedValue({}),
  mockedRefundEscrow: vi.fn().mockResolvedValue({}),
  mockedSendNotification: vi.fn().mockResolvedValue({}),
}));

vi.mock('./proposal.model.js', () => ({
  ProposalModel: {
    create: mockedProposalCreate,
    findById: mockedProposalFindById,
    findOne: vi.fn().mockResolvedValue(null),
    updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
  },
}));

vi.mock('../jobs/job.model.js', () => ({
  JobModel: {
    findById: mockedJobFindById,
    findOneAndUpdate: mockedJobFindOneAndUpdate,
    updateOne: vi.fn(),
  },
}));

vi.mock('../auth/auth.model.js', () => ({ default: { findById: mockedUserFindById } }));

vi.mock('../jobs/job.service.js', () => ({
  jobService: { assignProvider: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../wallet/wallet.service.js', () => ({
  walletService: { lockEscrow: mockedLockEscrow, refundEscrow: mockedRefundEscrow },
}));

vi.mock('../messaging/messaging.service.js', () => ({
  messagingService: { sendNotification: mockedSendNotification },
}));

import { proposalService } from './proposal.service.js';

const CLIENT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const PROVIDER_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const JOB_ID = 'cccccccccccccccccccccccc';

const jobDoc = (overrides: Record<string, any> = {}) => ({
  _id: JOB_ID,
  status: 'open',
  title: 'Paint a room',
  client: { clientId: CLIENT_ID },
  requirements: { categories: ['d0d0d0d0d0d0d0d0d0d0d0d0'], skillItems: [] },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedUserFindById.mockResolvedValue({ _id: PROVIDER_ID, role: 'provider', categories_selected: ['d0d0d0d0d0d0d0d0d0d0d0d0'], skill_items_selected: [] });
  mockedJobFindById.mockResolvedValue(jobDoc());
  mockedProposalCreate.mockResolvedValue({ _id: 'p1', toJSON: () => ({ _id: 'p1' }) });
  mockedSendNotification.mockResolvedValue({});
});

describe('proposalService.createProposal', () => {
  it('computes hourly bidAmount server-side from rate × hours', async () => {
    await proposalService.createProposal(PROVIDER_ID, {
      jobId: JOB_ID,
      bidAmount: 0, // client-sent value must be ignored for hourly
      bidType: 'hourly',
      hourlyRate: 5000,
      estimatedHours: 20,
      coverLetter: 'I have ten years of experience with this.',
      estimatedTimeline: '2 weeks',
    });

    expect(mockedProposalCreate).toHaveBeenCalledWith(
      expect.objectContaining({ bidAmount: 100000 })
    );
  });

  it('rejects an hourly bid that totals zero', async () => {
    await expect(
      proposalService.createProposal(PROVIDER_ID, {
        jobId: JOB_ID,
        bidAmount: 0,
        bidType: 'hourly',
        hourlyRate: 5000,
        estimatedHours: 0,
        coverLetter: 'I have ten years of experience with this.',
        estimatedTimeline: '2 weeks',
      })
    ).rejects.toMatchObject({ code: 'INVALID_BID' });
  });
});

describe('proposalService.acceptProposal', () => {
  const proposalDoc = () => ({
    _id: 'p1',
    jobId: JOB_ID,
    providerId: PROVIDER_ID,
    bidAmount: 50000,
    status: 'submitted',
    accept: vi.fn().mockResolvedValue(undefined),
    toJSON: () => ({ _id: 'p1' }),
  });

  it('locks escrow with a deterministic idempotency key', async () => {
    mockedProposalFindById.mockResolvedValue(proposalDoc());
    mockedJobFindOneAndUpdate.mockResolvedValue(jobDoc({ status: 'in_progress' }));

    await proposalService.acceptProposal('p1', CLIENT_ID);

    expect(mockedLockEscrow).toHaveBeenCalledWith(JOB_ID, 'p1', 50000, 'escrow_lock_p1');
  });

  it('refuses to accept when the job is no longer open (concurrent accept)', async () => {
    mockedProposalFindById.mockResolvedValue(proposalDoc());
    mockedJobFindOneAndUpdate.mockResolvedValue(null); // claim lost

    await expect(proposalService.acceptProposal('p1', CLIENT_ID)).rejects.toThrow(/not open/);
    expect(mockedLockEscrow).not.toHaveBeenCalled();
  });

  it('refunds escrow and reopens the job when a later step fails', async () => {
    const proposal = proposalDoc();
    proposal.accept = vi.fn().mockRejectedValue(new Error('save failed'));
    mockedProposalFindById.mockResolvedValue(proposal);
    mockedJobFindOneAndUpdate.mockResolvedValue(jobDoc({ status: 'in_progress' }));

    await expect(proposalService.acceptProposal('p1', CLIENT_ID)).rejects.toThrow('save failed');
    expect(mockedRefundEscrow).toHaveBeenCalledWith(JOB_ID, 50000, 'Proposal acceptance failed', 'escrow_lock_p1');
  });
});

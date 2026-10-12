import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockedJobFindById,
  mockedJobCreate,
  mockedUserFindById,
  mockedCategoryFind,
  mockedReleaseEscrow,
  mockedRefundEscrow,
} = vi.hoisted(() => ({
  mockedJobFindById: vi.fn(),
  mockedJobCreate: vi.fn(),
  mockedUserFindById: vi.fn(),
  mockedCategoryFind: vi.fn(),
  mockedReleaseEscrow: vi.fn().mockResolvedValue({ success: true }),
  mockedRefundEscrow: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('./job.model.js', () => ({
  JobModel: {
    findById: mockedJobFindById,
    create: mockedJobCreate,
    updateOne: vi.fn(() => ({ exec: vi.fn() })),
  },
}));

vi.mock('../auth/auth.model.js', () => ({ default: { findById: mockedUserFindById } }));

vi.mock('../verification/verification.model.js', () => ({
  SkillCategoryModel: { find: mockedCategoryFind },
}));

vi.mock('../wallet/wallet.service.js', () => ({
  walletService: { releaseEscrow: mockedReleaseEscrow, refundEscrow: mockedRefundEscrow },
}));

import { jobService } from './job.service.js';

const CLIENT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const PROVIDER_ID = 'bbbbbbbbbbbbbbbbbbbbbbbb';

const clientUser = { _id: CLIENT_ID, role: 'client', fullName: 'Client', provider_profile: {} };
const providerUser = { _id: PROVIDER_ID, role: 'provider', fullName: 'Provider', provider_profile: {} };

const baseLocation = { type: 'Point', coordinates: [-122.4, 37.7], city: 'SF', country: 'US' };

const buildDocument = (overrides: Record<string, any> = {}) => {
  const doc: any = {
    _id: 'job_1',
    status: 'open',
    title: 'Paint a room',
    type: 'physical',
    budget: { type: 'fixed', amount: 5000, currency: 'USD' },
    escrow: { lockedAmount: 5000, platformFeeAmount: 500, platformFeePercent: 10 },
    provider: {},
    dispute: {},
    client: { clientId: CLIENT_ID },
    save: vi.fn().mockResolvedValue(undefined),
    canTransitionTo: vi.fn().mockReturnValue({ allowed: true }),
    ...overrides,
  };
  return doc;
};

beforeEach(() => vi.clearAllMocks());

describe('jobService.createJob', () => {
  it('rejects non-client users', async () => {
    mockedUserFindById.mockResolvedValue(providerUser);
    await expect(
      jobService.createJob(PROVIDER_ID, {
        title: 'x'.repeat(6),
        description: 'y'.repeat(20),
        type: 'digital',
        location: null,
        budget: { type: 'fixed', amount: 1000, currency: 'USD' },
        schedule: { timezone: 'UTC', isFlexible: true },
        requirements: { categories: [CLIENT_ID] },
      } as any)
    ).rejects.toThrow(/Only clients can create jobs/);
  });

  it('rejects unknown categories', async () => {
    mockedUserFindById.mockResolvedValue(clientUser);
    mockedCategoryFind.mockResolvedValue([]);
    await expect(
      jobService.createJob(CLIENT_ID, {
        title: 'Paint a room',
        description: 'Need a painter for the living room walls',
        type: 'digital',
        location: null,
        budget: { type: 'fixed', amount: 1000, currency: 'USD' },
        schedule: { timezone: 'UTC', isFlexible: true },
        requirements: { categories: [CLIENT_ID] },
      } as any)
    ).rejects.toThrow(/categories not found/);
  });

  it('creates a digital job with a placeholder location', async () => {
    mockedUserFindById.mockResolvedValue(clientUser);
    mockedCategoryFind.mockResolvedValue([{ _id: CLIENT_ID }]);
    mockedJobCreate.mockImplementation(async (payload: any) => ({
      ...payload,
      toJSON: () => ({ ...payload, _id: 'job_1' }),
    }));

    const job = await jobService.createJob(CLIENT_ID, {
      title: 'Build an app',
      description: 'Need a React Native developer for a mobile app',
      type: 'digital',
      location: null,
      budget: { type: 'fixed', amount: 100000, currency: 'USD' },
      schedule: { timezone: 'UTC', isFlexible: true },
      requirements: { categories: [CLIENT_ID] },
    } as any);

    expect(job).toBeTruthy();
    expect(mockedJobCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'digital',
        status: 'open',
        location: expect.objectContaining({ coordinates: [0, 0] }),
      })
    );
  });
});

describe('jobService.transitionStatus', () => {
  it('rejects a transition the state machine disallows', async () => {
    mockedJobFindById.mockResolvedValue(
      buildDocument({ canTransitionTo: vi.fn().mockReturnValue({ allowed: false, reason: 'nope' }) })
    );
    await expect(
      jobService.transitionStatus('job_1', CLIENT_ID, 'client', 'completed')
    ).rejects.toThrow(/nope/);
  });

  it('releases escrow when a job is completed', async () => {
    mockedJobFindById.mockResolvedValue(buildDocument({ status: 'in_progress' }));

    await jobService.transitionStatus('job_1', CLIENT_ID, 'client', 'completed');

    expect(mockedReleaseEscrow).toHaveBeenCalledTimes(1);
    // platformFee (500) deducted from locked (5000) -> provider gets 4500
    expect(mockedReleaseEscrow).toHaveBeenCalledWith(
      'job_1',
      expect.objectContaining({ providerAmount: 4500, platformFee: 500 }),
      expect.any(String)
    );
  });

  it('refunds escrow when a job with locked funds is cancelled', async () => {
    mockedJobFindById.mockResolvedValue(buildDocument({ status: 'in_progress' }));

    await jobService.transitionStatus('job_1', CLIENT_ID, 'client', 'cancelled');

    expect(mockedRefundEscrow).toHaveBeenCalledWith('job_1', 5000, expect.any(String), expect.any(String));
  });
});

describe('jobService.assignProvider', () => {
  it('assigns a provider and moves the job to in_progress', async () => {
    const job = buildDocument();
    mockedJobFindById.mockResolvedValue(job);
    mockedUserFindById.mockResolvedValue(providerUser);

    await jobService.assignProvider('job_1', PROVIDER_ID, 'cccccccccccccccccccccccc');

    expect(job.status).toBe('in_progress');
    expect(job.provider.providerId).toBe(PROVIDER_ID);
    expect(job.save).toHaveBeenCalled();
  });

  it('refuses to assign a provider to a non-open job', async () => {
    mockedJobFindById.mockResolvedValue(buildDocument({ status: 'in_progress' }));
    await expect(
      jobService.assignProvider('job_1', PROVIDER_ID, 'cccccccccccccccccccccccc')
    ).rejects.toThrow(/not open/);
  });
});

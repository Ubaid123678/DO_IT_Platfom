import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockedFind,
  mockedFindById,
  mockedCountDocuments,
  mockedActionLogCreate,
} = vi.hoisted(() => ({
  mockedFind: vi.fn(),
  mockedFindById: vi.fn(),
  mockedCountDocuments: vi.fn(),
  mockedActionLogCreate: vi.fn(),
}));

vi.mock('../auth/auth.model.js', () => ({
  default: {
    find: mockedFind,
    findById: mockedFindById,
    countDocuments: mockedCountDocuments,
  },
}));

vi.mock('../verification/verification.model.js', () => ({
  VerificationRecordModel: { aggregate: vi.fn() },
}));

vi.mock('./admin-action-log.model.js', () => ({
  default: { create: mockedActionLogCreate },
}));

import { adminService } from './admin.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const makeUser = (
  id: Types.ObjectId,
  role: 'admin' | 'client' | 'provider' = 'admin',
) => ({
  _id: id,
  id: id.toString(),
  role,
  isActive: true,
  deletedAt: undefined,
  deletedBy: undefined,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  save: vi.fn().mockResolvedValue(undefined),
});

describe('adminService user protections', () => {
  it('combines user filters, escapes prefix search, and calculates pagination totals', async () => {
    const listQuery = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    mockedFind.mockReturnValue(listQuery);
    mockedCountDocuments.mockResolvedValue(37);

    const result = await adminService.listUsers({
      page: 2,
      limit: 10,
      search: 'a.*',
      role: 'provider',
      email_verified: true,
      phone_verified: false,
      kyc_status: 'pending',
      overall_status: 'partially_verified',
      track: 'digital',
      sort_by: 'email',
      sort_order: 'asc',
    });

    const filter = mockedFind.mock.calls[0][0] as Record<string, unknown>;
    expect(filter).toMatchObject({
      role: 'provider',
      emailVerified: true,
      phoneVerified: false,
      kyc_status: 'pending',
      overall_status: 'partially_verified',
      track: 'digital',
    });
    const searchAlternatives = filter.$or as { [key: string]: RegExp }[];
    expect(searchAlternatives).toHaveLength(3);
    expect(searchAlternatives[0].fullName.source).toBe('^a\\.\\*');
    expect(searchAlternatives[0].fullName.ignoreCase).toBe(true);
    expect(listQuery.sort).toHaveBeenCalledWith({ email: 1, _id: 1 });
    expect(listQuery.skip).toHaveBeenCalledWith(10);
    expect(listQuery.limit).toHaveBeenCalledWith(10);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 37,
      totalPages: 4,
    });
  });

  it('prevents an admin from demoting their own account', async () => {
    const adminId = new Types.ObjectId();
    mockedFindById.mockResolvedValue(makeUser(adminId));

    await expect(
      adminService.updateUser(adminId.toString(), adminId.toString(), {
        role: 'client',
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'SELF_MODIFICATION_FORBIDDEN',
    });
    expect(mockedCountDocuments).not.toHaveBeenCalled();
    expect(mockedActionLogCreate).not.toHaveBeenCalled();
  });

  it('prevents an admin from deactivating their own account', async () => {
    const adminId = new Types.ObjectId();
    mockedFindById.mockResolvedValue(makeUser(adminId));

    await expect(
      adminService.updateUser(adminId.toString(), adminId.toString(), {
        isActive: false,
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'SELF_MODIFICATION_FORBIDDEN',
    });
    expect(mockedActionLogCreate).not.toHaveBeenCalled();
  });

  it('prevents an admin from soft deleting their own account', async () => {
    const adminId = new Types.ObjectId();
    mockedFindById.mockResolvedValue(makeUser(adminId));

    await expect(
      adminService.deleteUser(adminId.toString(), adminId.toString()),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'SELF_MODIFICATION_FORBIDDEN',
    });
    expect(mockedActionLogCreate).not.toHaveBeenCalled();
  });

  it('prevents removing the last active admin', async () => {
    const actorId = new Types.ObjectId();
    const targetId = new Types.ObjectId();
    mockedFindById.mockResolvedValue(makeUser(targetId));
    mockedCountDocuments.mockResolvedValue(1);

    await expect(
      adminService.updateUser(actorId.toString(), targetId.toString(), {
        role: 'provider',
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'LAST_ACTIVE_ADMIN' });
    expect(mockedActionLogCreate).not.toHaveBeenCalled();
  });

  it('records the previous and updated role when an admin changes a user role', async () => {
    const actorId = new Types.ObjectId();
    const targetId = new Types.ObjectId();
    const target = makeUser(targetId, 'client');
    mockedFindById.mockResolvedValue(target);
    mockedActionLogCreate.mockResolvedValue({});

    const result = await adminService.updateUser(
      actorId.toString(),
      targetId.toString(),
      {
        role: 'provider',
        reason: 'Approved provider application',
      },
    );

    expect(target.role).toBe('provider');
    expect(target.save).toHaveBeenCalledOnce();
    expect(mockedActionLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: actorId,
        targetUserId: targetId,
        action: 'user_updated',
        before: expect.objectContaining({ role: 'client' }),
        after: expect.objectContaining({ role: 'provider' }),
      }),
    );
    expect(result.role).toBe('provider');
  });

  it('soft deletes a user and records the deleting admin', async () => {
    const actorId = new Types.ObjectId();
    const targetId = new Types.ObjectId();
    const target = makeUser(targetId, 'client');
    mockedFindById.mockResolvedValue(target);
    mockedActionLogCreate.mockResolvedValue({});

    const result = await adminService.deleteUser(
      actorId.toString(),
      targetId.toString(),
      'Account abuse',
    );

    expect(target.isActive).toBe(false);
    expect(target.deletedAt).toBeInstanceOf(Date);
    expect(target.deletedBy).toEqual(actorId);
    expect(target.save).toHaveBeenCalledOnce();
    expect(mockedActionLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user_deleted',
        reason: 'Account abuse',
        before: expect.objectContaining({ isActive: true }),
        after: expect.objectContaining({ isActive: false }),
      }),
    );
    expect(result.isActive).toBe(false);
  });
});

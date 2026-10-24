import { Types } from 'mongoose';

import { AppError } from '../../common/errors/AppError.js';
import { getPagination } from '../../common/utils/pagination.js';
import UserModel, { type IUser, type KycUserStatus, type UserOverallStatus } from '../auth/auth.model.js';
import KycDocumentModel from '../kyc/kyc.model.js';
import {
  AdminReviewModel,
  VerificationRecordModel,
  type VerificationStatus,
} from '../verification/verification.model.js';
import AdminActionLogModel from './admin-action-log.model.js';
import type {
  AdminUserListQuery,
  AdminUserListResult,
  AdminUserUpdateInput,
  AdminVerificationCounts,
} from './admin.types.js';

const USER_LIST_PROJECTION = [
  '_id',
  'fullName',
  'email',
  'phone',
  'role',
  'countryCode',
  'emailVerified',
  'phoneVerified',
  'headline',
  'overall_status',
  'track',
  'kyc_status',
  'categories_selected',
  'isActive',
  'createdAt',
  'updatedAt',
].join(' ');

const USER_DETAIL_PROJECTION = [
  '_id',
  'fullName',
  'email',
  'phone',
  'role',
  'countryCode',
  'emailVerified',
  'phoneVerified',
  'avatar_url',
  'categories_selected',
  'skill_items_selected',
  'track',
  'provider_profile',
  'headline',
  'bio',
  'languages',
  'work_history',
  'education',
  'public_profile',
  'kyc_status',
  'overall_status',
  'isActive',
  'createdAt',
  'updatedAt',
].join(' ');

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'draft',
  'pending_review',
  'scheduled',
  'auto_approved',
  'approved',
  'rejected',
  'expired',
];

const APPROVED_VERIFICATION_STATUSES: VerificationStatus[] = [
  'approved',
  'auto_approved',
];

interface RealtimeStatusUser {
  _id: Types.ObjectId;
  categories_selected?: string[];
}

// The user document's `kyc_status` / `overall_status` are denormalized mirrors
// that go stale (see scripts/migrate-kyc-status.ts). Admin screens must show the
// source of truth, so derive both here from the KYC + verification records.
// ponytail: 3 extra aggregations per admin list request; cache or persist if the
// user list grows past a few thousand rows per page.
const buildRealtimeStatusMap = async (
  users: RealtimeStatusUser[],
): Promise<
  Map<string, { kyc_status: KycUserStatus; overall_status: UserOverallStatus }>
> => {
  const userIds = users.map((user) => user._id);
  const result = new Map<
    string,
    { kyc_status: KycUserStatus; overall_status: UserOverallStatus }
  >();
  if (userIds.length === 0) return result;

  const [kycGroups, approvedGroups, rejectedRows] = await Promise.all([
    KycDocumentModel.aggregate<{ _id: Types.ObjectId; status: KycUserStatus }>([
      { $match: { userId: { $in: userIds } } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $group: { _id: '$userId', status: { $first: '$status' } } },
    ]),
    VerificationRecordModel.aggregate<{
      _id: { provider_id: Types.ObjectId; category_id: Types.ObjectId };
    }>([
      {
        $match: {
          provider_id: { $in: userIds },
          status: { $in: APPROVED_VERIFICATION_STATUSES },
        },
      },
      {
        $group: {
          _id: { provider_id: '$provider_id', category_id: '$category_id' },
        },
      },
    ]),
    VerificationRecordModel.aggregate<{ _id: Types.ObjectId }>([
      { $match: { provider_id: { $in: userIds }, status: 'rejected' } },
      { $group: { _id: '$provider_id' } },
    ]),
  ]);

  const kycByUser = new Map(kycGroups.map((row) => [row._id.toString(), row.status]));
  const approvedCategoriesByUser = new Map<string, Set<string>>();
  for (const row of approvedGroups) {
    const userId = row._id.provider_id.toString();
    const set = approvedCategoriesByUser.get(userId) ?? new Set<string>();
    set.add(row._id.category_id.toString());
    approvedCategoriesByUser.set(userId, set);
  }
  const rejectedUsers = new Set(rejectedRows.map((row) => row._id.toString()));

  for (const user of users) {
    const userId = user._id.toString();
    const kycStatus = kycByUser.get(userId) ?? 'missing';
    result.set(userId, {
      kyc_status: kycStatus,
      overall_status: deriveOverallStatus(
        kycStatus,
        user.categories_selected ?? [],
        approvedCategoriesByUser.get(userId) ?? new Set(),
        rejectedUsers.has(userId),
      ),
    });
  }

  return result;
};

export const deriveOverallStatus = (
  kycStatus: KycUserStatus,
  selectedCategoryIds: string[],
  approvedCategoryIds: Set<string>,
  hasRejectedRecord: boolean,
): UserOverallStatus => {
  if (kycStatus !== 'approved') return 'pending';
  if (selectedCategoryIds.length === 0) return 'incomplete';
  if (selectedCategoryIds.every((id) => approvedCategoryIds.has(id))) return 'verified';
  if (approvedCategoryIds.size > 0) return 'partially_verified';
  if (hasRejectedRecord) return 'rejected';
  return 'pending';
};

interface RecentActivityItem {
  admin: { id: string; fullName: string };
  action: string;
  target: { id: string; fullName: string; email: string } | null;
  created_at: Date;
}

const getRecentActivity = async (): Promise<RecentActivityItem[]> => {
  const usersCollection = UserModel.collection.name;
  const verificationCollection = VerificationRecordModel.collection.name;
  const [userActions, reviews] = await Promise.all([
    AdminActionLogModel.aggregate<RecentActivityItem>([
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: usersCollection,
          localField: 'adminId',
          foreignField: '_id',
          as: 'admin',
        },
      },
      { $unwind: '$admin' },
      {
        $lookup: {
          from: usersCollection,
          localField: 'targetUserId',
          foreignField: '_id',
          as: 'target',
        },
      },
      { $unwind: { path: '$target', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          admin: { id: '$admin._id', fullName: '$admin.fullName' },
          action: 1,
          target: {
            id: '$target._id',
            fullName: '$target.fullName',
            email: '$target.email',
          },
          created_at: '$createdAt',
        },
      },
    ]),
    AdminReviewModel.aggregate<RecentActivityItem>([
      { $sort: { created_at: -1, _id: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: verificationCollection,
          localField: 'verification_record_id',
          foreignField: '_id',
          as: 'record',
        },
      },
      { $unwind: { path: '$record', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: usersCollection,
          localField: 'admin_id',
          foreignField: '_id',
          as: 'admin',
        },
      },
      { $unwind: '$admin' },
      {
        $lookup: {
          from: usersCollection,
          localField: 'record.provider_id',
          foreignField: '_id',
          as: 'target',
        },
      },
      { $unwind: { path: '$target', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          admin: { id: '$admin._id', fullName: '$admin.fullName' },
          action: 1,
          target: {
            id: '$target._id',
            fullName: '$target.fullName',
            email: '$target.email',
          },
          created_at: '$created_at',
        },
      },
    ]),
  ]);

  return [...userActions, ...reviews]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 10);
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getObjectId = (userId: string): Types.ObjectId => {
  if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
    throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
  }
  return new Types.ObjectId(userId);
};

const getUserOrThrow = async (userId: string): Promise<IUser> => {
  const user = await UserModel.findById(getObjectId(userId));
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return user;
};

const getActionSnapshot = (user: IUser): Record<string, unknown> => ({
  id: user._id.toString(),
  role: user.role,
  isActive: user.isActive !== false,
  deletedAt: user.deletedAt ?? null,
  deletedBy: user.deletedBy?.toString() ?? null,
});

const isActiveAdmin = (user: IUser): boolean =>
  user.role === 'admin' && user.isActive !== false && !user.deletedAt;

const assertNotSelfModification = (
  adminId: string,
  targetId: Types.ObjectId,
): void => {
  if (adminId === targetId.toString()) {
    throw new AppError(
      'You cannot demote or deactivate your own account',
      403,
      'SELF_MODIFICATION_FORBIDDEN',
    );
  }
};

const assertNotLastActiveAdmin = async (user: IUser): Promise<void> => {
  if (!isActiveAdmin(user)) return;

  const activeAdminCount = await UserModel.countDocuments({
    role: 'admin',
    isActive: { $ne: false },
    deletedAt: null,
  });

  if (activeAdminCount <= 1) {
    throw new AppError(
      'The last active admin cannot be removed',
      409,
      'LAST_ACTIVE_ADMIN',
    );
  }
};

export const adminService = {
  getDashboardStats: async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      clients,
      providers,
      newLast7Days,
      kycPending,
      kycApproved,
      kycRejected,
      verificationPending,
      slaOverdue,
      approvedToday,
      rejectedToday,
      recentActivity,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: 'client' }),
      UserModel.countDocuments({ role: 'provider' }),
      UserModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      UserModel.countDocuments({ kyc_status: 'pending' }),
      UserModel.countDocuments({ kyc_status: 'approved' }),
      UserModel.countDocuments({ kyc_status: 'rejected' }),
      VerificationRecordModel.countDocuments({ status: 'pending_review' }),
      VerificationRecordModel.countDocuments({
        status: 'pending_review',
        sla_due_at: { $lt: now },
      }),
      VerificationRecordModel.countDocuments({
        status: 'approved',
        reviewed_at: { $gte: startOfToday, $lt: endOfToday },
      }),
      VerificationRecordModel.countDocuments({
        status: 'rejected',
        reviewed_at: { $gte: startOfToday, $lt: endOfToday },
      }),
      getRecentActivity(),
    ]);

    return {
      users: { total: totalUsers, clients, providers, newLast7Days },
      kyc: {
        pending: kycPending,
        approved: kycApproved,
        rejected: kycRejected,
      },
      verification: {
        pending_review: verificationPending,
        slaOverdue,
        approvedToday,
        rejectedToday,
      },
      recentActivity,
    };
  },

  listUsers: async (
    query: AdminUserListQuery,
  ): Promise<AdminUserListResult> => {
    const filter: Record<string, unknown> = {};

    if (query.role) filter.role = query.role;
    if (query.email_verified !== undefined)
      filter.emailVerified = query.email_verified;
    if (query.phone_verified !== undefined)
      filter.phoneVerified = query.phone_verified;
    if (query.kyc_status) filter.kyc_status = query.kyc_status;
    if (query.overall_status) filter.overall_status = query.overall_status;
    if (query.track) filter.track = query.track;
    if (query.search) {
      const prefix = new RegExp(`^${escapeRegExp(query.search)}`, 'i');
      filter.$or = [{ fullName: prefix }, { email: prefix }, { phone: prefix }];
    }

    const direction = query.sort_order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = {
      [query.sort_by]: direction,
      _id: direction,
    };
    const { page, limit, skip } = getPagination(query);

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select(USER_LIST_PROJECTION)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    const statusMap = await buildRealtimeStatusMap(users);

    return {
      users: users.map((user) => {
        const realtime = statusMap.get(user._id.toString());
        return {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          countryCode: user.countryCode,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          headline: user.headline,
          overall_status: realtime?.overall_status ?? 'incomplete',
          track: user.track,
          kyc_status: realtime?.kyc_status ?? 'missing',
          isActive: user.isActive !== false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getUserDetail: async (userId: string) => {
    const objectId = getObjectId(userId);
    const user = await UserModel.findById(objectId)
      .select(USER_DETAIL_PROJECTION)
      .lean();
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const groupedCounts = await VerificationRecordModel.aggregate<{
      _id: VerificationStatus;
      count: number;
    }>([
      { $match: { provider_id: objectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const verificationCounts = Object.fromEntries(
      VERIFICATION_STATUSES.map((status) => [status, 0]),
    ) as AdminVerificationCounts;
    for (const group of groupedCounts)
      verificationCounts[group._id] = group.count;
    verificationCounts.total = groupedCounts.reduce(
      (sum, group) => sum + group.count,
      0,
    );

    const statusMap = await buildRealtimeStatusMap([user]);
    const realtime = statusMap.get(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        countryCode: user.countryCode,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        avatar_url: user.avatar_url,
        categories_selected: user.categories_selected ?? [],
        skill_items_selected: user.skill_items_selected ?? [],
        track: user.track,
        provider_profile: user.provider_profile ?? {},
        headline: user.headline,
        bio: user.bio,
        languages: user.languages ?? [],
        work_history: user.work_history ?? [],
        education: user.education ?? [],
        public_profile: user.public_profile ?? false,
        kyc_status: realtime?.kyc_status ?? 'missing',
        overall_status: realtime?.overall_status ?? 'incomplete',
        isActive: user.isActive !== false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      verification_counts: verificationCounts,
    };
  },

  updateUser: async (
    adminId: string,
    userId: string,
    input: AdminUserUpdateInput,
  ) => {
    const objectId = getObjectId(userId);
    const user = await getUserOrThrow(userId);
    const before = getActionSnapshot(user);
    const roleChangeRemovesAdmin =
      input.role !== undefined && input.role !== 'admin';
    const deactivationRemovesAdmin = input.isActive === false;

    if (roleChangeRemovesAdmin || deactivationRemovesAdmin) {
      assertNotSelfModification(adminId, objectId);
    }
    if (
      (roleChangeRemovesAdmin || deactivationRemovesAdmin) &&
      isActiveAdmin(user)
    ) {
      await assertNotLastActiveAdmin(user);
    }

    if (input.role !== undefined) user.role = input.role;
    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
      if (input.isActive) {
        user.deletedAt = undefined;
        user.deletedBy = undefined;
      }
    }
    await user.save();

    const after = getActionSnapshot(user);
    await AdminActionLogModel.create({
      adminId: new Types.ObjectId(adminId),
      action: 'user_updated',
      targetUserId: objectId,
      before,
      after,
      reason: input.reason,
    });

    return {
      id: user.id,
      role: user.role,
      isActive: user.isActive !== false,
      deletedAt: user.deletedAt ?? null,
      updatedAt: user.updatedAt,
    };
  },

  deleteUser: async (adminId: string, userId: string, reason?: string) => {
    const objectId = getObjectId(userId);
    const user = await getUserOrThrow(userId);
    assertNotSelfModification(adminId, objectId);
    await assertNotLastActiveAdmin(user);

    const before = getActionSnapshot(user);
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletedBy = new Types.ObjectId(adminId);
    await user.save();

    const after = getActionSnapshot(user);
    await AdminActionLogModel.create({
      adminId: new Types.ObjectId(adminId),
      action: 'user_deleted',
      targetUserId: objectId,
      before,
      after,
      reason,
    });

    return {
      id: user.id,
      isActive: false,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy.toString(),
      updatedAt: user.updatedAt,
    };
  },
};

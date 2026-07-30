import { AppError } from '../../common/errors/AppError.js';
import UserModel from '../auth/auth.model.js';
import KycDocumentModel from '../kyc/kyc.model.js';
import {
  AdminReviewModel,
  ResumeParseResultModel,
  SkillCategoryModel,
  SkillItemModel,
  VerificationRecordModel,
  type EvidenceType,
  type OverallStatus,
  type VerificationStatus,
} from './verification.model.js';

const getUserOrThrow = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return user;
};

const assertProviderOrAdmin = (user: { role: string }): void => {
  if (!['provider', 'admin'].includes(user.role)) {
    throw new AppError('Only providers can access verification flows', 403, 'VERIFICATION_PROVIDER_REQUIRED');
  }
};

const assertAdmin = (user: { role: string }): void => {
  if (user.role !== 'admin') throw new AppError('Admin access required', 403, 'FORBIDDEN');
};

const serializeVerificationRecord = (record: Record<string, unknown>) => ({
  id: record._id,
  provider_id: record.provider_id,
  category_id: record.category_id,
  skill_item_id: record.skill_item_id,
  verification_track: record.verification_track,
  evidence_type: record.evidence_type,
  status: record.status,
  auto_check_result: record.auto_check_result ?? null,
  sla_due_at: record.sla_due_at ?? null,
  reviewed_by: record.reviewed_by ?? null,
  reviewed_at: record.reviewed_at ?? null,
  rejection_reason: record.rejection_reason ?? null,
  created_at: record.created_at,
  updated_at: record.updated_at,
});

const recomputeOverallStatus = async (providerId: string): Promise<OverallStatus> => {
  const kycDoc = await KycDocumentModel.findOne({ userId: providerId }).sort({ createdAt: -1 }).lean();
  const kycApproved = kycDoc?.status === 'approved';

  if (!kycApproved) return 'pending';

  const provider = await UserModel.findById(providerId);
  if (!provider) return 'pending';

  const providerData = provider.toJSON?.() as Record<string, unknown> ?? {};
  const selectedCategoryIds = (providerData.categories_selected ?? []) as string[];

  if (selectedCategoryIds.length === 0) return 'incomplete';

  const approvalStatuses: VerificationStatus[] = ['approved', 'auto_approved'];
  const records = await VerificationRecordModel.find({
    provider_id: providerId,
    status: { $in: approvalStatuses },
  }).lean();

  const approvedCategoryIds = new Set(records.map((r) => r.category_id.toString()));
  const allApproved = selectedCategoryIds.every((cid) => approvedCategoryIds.has(cid));

  if (allApproved) return 'verified';
  if (approvedCategoryIds.size > 0) return 'partially_verified';

  const anyRejected = await VerificationRecordModel.exists({
    provider_id: providerId,
    status: 'rejected',
  });
  if (anyRejected) return 'rejected';

  return 'pending';
};

export const verificationService = {
  listCategories: async (jobType?: string, activeOnly = true) => {
    const filter: Record<string, unknown> = {};
    if (jobType) filter.job_type = jobType;
    if (activeOnly) filter.active = true;
    const categories = await SkillCategoryModel.find(filter).sort({ name: 1 }).lean();
    return categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      job_type: c.job_type,
      icon_url: c.icon_url ?? null,
      risk_tier: c.risk_tier,
      active: c.active,
    }));
  },

  listSkillItems: async (categoryId: string) => {
    const category = await SkillCategoryModel.findById(categoryId);
    if (!category) throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    const items = await SkillItemModel.find({ category_id: categoryId, active: true }).sort({ name: 1 }).lean();
    return items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      requires_certificate: item.requires_certificate,
    }));
  },

  selectCategories: async (userId: string, input: { categories: string[]; skill_items: string[] }) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const catIds = input.categories;
    const skillItemIds = input.skill_items;

    if (catIds.length < 1 || catIds.length > 3) {
      throw new AppError('Select 1-3 categories', 400, 'VALIDATION_ERROR');
    }

    const existingCats = await SkillCategoryModel.find({ _id: { $in: catIds }, active: true }).lean();
    if (existingCats.length !== catIds.length) {
      throw new AppError('One or more categories are invalid or inactive', 400, 'INVALID_CATEGORY');
    }

    const skillItems = await SkillItemModel.find({ _id: { $in: skillItemIds }, active: true }).lean();
    if (skillItems.length !== skillItemIds.length) {
      throw new AppError('One or more skill items are invalid or inactive', 400, 'INVALID_SKILL_ITEM');
    }

    for (const item of skillItems) {
      if (!catIds.includes(item.category_id.toString())) {
        throw new AppError(`Skill item "${item.name}" does not belong to selected categories`, 400, 'SKILL_ITEM_CATEGORY_MISMATCH');
      }
    }

    user.set('categories_selected', catIds);
    user.set('skill_items_selected', skillItemIds);
    await user.save();

    return { message: 'Categories and skills selected successfully' };
  },

  getSelectedCategories: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    const json = user.toJSON() as Record<string, unknown>;
    const selectedIds = (json.categories_selected ?? []) as string[];
    if (selectedIds.length === 0) return { categories: [] };

    const categories = await SkillCategoryModel.find({ _id: { $in: selectedIds } }).lean();
    return {
      categories: categories.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        job_type: c.job_type,
      })),
    };
  },

  submitEvidence: async (
    userId: string,
    input: { category_id: string; skill_item_id: string; evidence_type: EvidenceType; evidence_payload: Record<string, unknown> },
  ) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const category = await SkillCategoryModel.findById(input.category_id);
    if (!category || !category.active) throw new AppError('Category not found or inactive', 404, 'CATEGORY_NOT_FOUND');

    const skillItem = await SkillItemModel.findById(input.skill_item_id);
    if (!skillItem || !skillItem.active) throw new AppError('Skill item not found or inactive', 404, 'SKILL_ITEM_NOT_FOUND');

    const slaDueAt = new Date();
    slaDueAt.setHours(slaDueAt.getHours() + (category.sla_hours || 48));

    const record = await VerificationRecordModel.create({
      provider_id: userId,
      category_id: input.category_id,
      skill_item_id: input.skill_item_id,
      verification_track: category.job_type,
      evidence_type: input.evidence_type,
      evidence_payload: input.evidence_payload,
      status: 'pending_review',
      sla_due_at: slaDueAt,
      created_at: new Date(),
    });

    const overallStatus = await recomputeOverallStatus(userId);
    user.set('overall_status', overallStatus);
    await user.save();

    return serializeVerificationRecord(record.toJSON() as Record<string, unknown>);
  },

  submitBatchEvidence: async (
    userId: string,
    input: { evidence_batch: { category_id: string; skill_item_id: string; evidence_type: EvidenceType; evidence_payload: Record<string, unknown> }[] },
  ) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const createdRecords = [];
    for (const item of input.evidence_batch) {
      const category = await SkillCategoryModel.findById(item.category_id);
      if (!category || !category.active) {
        throw new AppError(`Category ${item.category_id} not found or inactive`, 404, 'CATEGORY_NOT_FOUND');
      }

      const skillItem = await SkillItemModel.findById(item.skill_item_id);
      if (!skillItem || !skillItem.active) {
        throw new AppError(`Skill item ${item.skill_item_id} not found or inactive`, 404, 'SKILL_ITEM_NOT_FOUND');
      }

      const slaDueAt = new Date();
      slaDueAt.setHours(slaDueAt.getHours() + (category.sla_hours || 48));

      const record = await VerificationRecordModel.create({
        provider_id: userId,
        category_id: item.category_id,
        skill_item_id: item.skill_item_id,
        verification_track: category.job_type,
        evidence_type: item.evidence_type,
        evidence_payload: item.evidence_payload,
        status: 'pending_review',
        sla_due_at: slaDueAt,
        created_at: new Date(),
      });

      createdRecords.push(serializeVerificationRecord(record.toJSON() as Record<string, unknown>));
    }

    const overallStatus = await recomputeOverallStatus(userId);
    user.set('overall_status', overallStatus);
    await user.save();

    return createdRecords;
  },

  listMyRecords: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const records = await VerificationRecordModel.find({ provider_id: userId })
      .sort({ created_at: -1 })
      .populate('category_id', 'name job_type')
      .populate('skill_item_id', 'name')
      .lean();

    return records.map((r) => ({
      id: r._id.toString(),
      category_id: r.category_id.toString(),
      category: (r.category_id as unknown as { name?: string; job_type?: string })?.name ?? null,
      category_job_type: (r.category_id as unknown as { job_type?: string })?.job_type ?? null,
      skill_item_id: r.skill_item_id.toString(),
      skill_item: (r.skill_item_id as unknown as { name?: string })?.name ?? null,
      evidence_type: r.evidence_type,
      status: r.status,
      sla_due_at: r.sla_due_at ?? null,
      rejection_reason: r.rejection_reason ?? null,
      created_at: r.created_at,
    }));
  },

  getRecordDetail: async (userId: string, recordId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const record = await VerificationRecordModel.findOne({ _id: recordId, provider_id: userId })
      .populate('category_id', 'name job_type')
      .populate('skill_item_id', 'name')
      .lean();

    if (!record) throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');

    return {
      id: record._id.toString(),
      category_id: record.category_id.toString(),
      category: (record.category_id as unknown as { name?: string })?.name ?? null,
      skill_item_id: record.skill_item_id.toString(),
      skill_item: (record.skill_item_id as unknown as { name?: string })?.name ?? null,
      evidence_type: record.evidence_type,
      evidence_payload: record.evidence_payload,
      status: record.status,
      auto_check_result: record.auto_check_result ?? null,
      sla_due_at: record.sla_due_at ?? null,
      rejection_reason: record.rejection_reason ?? null,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  },

  resubmitEvidence: async (
    userId: string,
    recordId: string,
    input: { evidence_type: EvidenceType; evidence_payload: Record<string, unknown> },
  ) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const existing = await VerificationRecordModel.findOne({ _id: recordId, provider_id: userId });
    if (!existing) throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    if (existing.status !== 'rejected') {
      throw new AppError('Resubmission is only allowed for rejected records', 409, 'RESUBMISSION_NOT_ALLOWED');
    }

    const category = await SkillCategoryModel.findById(existing.category_id);
    const slaDueAt = new Date();
    slaDueAt.setHours(slaDueAt.getHours() + (category?.sla_hours || 48));

    const newRecord = await VerificationRecordModel.create({
      provider_id: userId,
      category_id: existing.category_id,
      skill_item_id: existing.skill_item_id,
      verification_track: existing.verification_track,
      evidence_type: input.evidence_type,
      evidence_payload: input.evidence_payload,
      status: 'pending_review',
      sla_due_at: slaDueAt,
      created_at: new Date(),
    });

    return serializeVerificationRecord(newRecord.toJSON() as Record<string, unknown>);
  },

  updateProfile: async (userId: string, profileData: Record<string, unknown>) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const allowedFields = ['headline', 'bio', 'years_experience', 'languages', 'work_history', 'education', 'public_profile'];
    for (const key of allowedFields) {
      if (profileData[key] !== undefined) {
        user.set(key, profileData[key]);
      }
    }
    await user.save();

    const json = user.toJSON() as Record<string, unknown>;
    return {
      headline: json.headline ?? null,
      bio: json.bio ?? null,
      years_experience: json.years_experience ?? null,
      languages: json.languages ?? [],
      work_history: json.work_history ?? [],
      education: json.education ?? [],
      public_profile: json.public_profile ?? false,
    };
  },

  getProfile: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);
    const json = user.toJSON() as Record<string, unknown>;
    return {
      headline: json.headline ?? null,
      bio: json.bio ?? null,
      years_experience: json.years_experience ?? null,
      languages: json.languages ?? [],
      work_history: json.work_history ?? [],
      education: json.education ?? [],
      public_profile: json.public_profile ?? false,
    };
  },

  uploadResumeFile: async (userId: string, fileUrl: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    user.set('resume_file_url', fileUrl);
    await user.save();

    const result = await ResumeParseResultModel.create({
      provider_id: userId,
      source_file_url: fileUrl,
      applied: false,
    });

    return { resume_file_url: fileUrl, parse_result_id: result._id.toString() };
  },

  getResumeParseResult: async (userId: string, resultId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const result = await ResumeParseResultModel.findOne({ _id: resultId, provider_id: userId }).lean();
    if (!result) throw new AppError('Resume parse result not found', 404, 'PARSE_RESULT_NOT_FOUND');

    return {
      id: result._id.toString(),
      source_file_url: result.source_file_url,
      parsed_fields: result.parsed_fields ?? null,
      confidence_score: result.confidence_score ?? null,
      applied: result.applied,
      created_at: result.created_at,
    };
  },

  getVerificationStatus: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    const json = user.toJSON() as Record<string, unknown>;
    const overallStatus = (json.overall_status as OverallStatus) ?? 'incomplete';

    const records = await VerificationRecordModel.find({ provider_id: userId })
      .populate('category_id', 'name')
      .lean();

    const categoryMap = new Map<string, { name: string; statuses: Set<VerificationStatus> }>();
    for (const r of records) {
      const catId = r.category_id.toString();
      const catName = (r.category_id as unknown as { name?: string })?.name ?? 'Unknown';
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: catName, statuses: new Set() });
      }
      categoryMap.get(catId)!.statuses.add(r.status);
    }

    const categories = Array.from(categoryMap.entries()).map(([id, data]) => {
      const statuses = Array.from(data.statuses);
      let catStatus: string;
      if (statuses.some((s) => ['approved', 'auto_approved'].includes(s))) catStatus = 'verified';
      else if (statuses.includes('rejected')) catStatus = 'rejected';
      else if (statuses.includes('pending_review')) catStatus = 'pending';
      else catStatus = 'incomplete';
      return { category_id: id, category_name: data.name, status: catStatus };
    });

    return {
      overall_status: overallStatus,
      categories,
      has_pending: records.some((r) => r.status === 'pending_review'),
      has_rejected: records.some((r) => r.status === 'rejected'),
      all_verified: overallStatus === 'verified',
    };
  },

  listForAdmin: async (adminId: string, query: { status?: string; category_id?: string; sla_overdue?: boolean; limit?: number; skip?: number }) => {
    const admin = await getUserOrThrow(adminId);
    assertAdmin(admin);

    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.category_id) filter.category_id = query.category_id;
    if (query.sla_overdue) filter.sla_due_at = { $lt: new Date() };

    const records = await VerificationRecordModel.find(filter)
      .sort({ created_at: -1 })
      .skip(query.skip ?? 0)
      .limit(query.limit ?? 50)
      .populate('provider_id', 'fullName email')
      .populate('category_id', 'name')
      .populate('skill_item_id', 'name')
      .lean();

    const total = await VerificationRecordModel.countDocuments(filter);

    return {
      records: records.map((r) => ({
        id: r._id.toString(),
        provider: (r.provider_id as unknown as { fullName?: string; email?: string }) ?? null,
        category: (r.category_id as unknown as { name?: string })?.name ?? null,
        skill_item: (r.skill_item_id as unknown as { name?: string })?.name ?? null,
        evidence_type: r.evidence_type,
        status: r.status,
        sla_due_at: r.sla_due_at ?? null,
        rejection_reason: r.rejection_reason ?? null,
        created_at: r.created_at,
      })),
      total,
      limit: query.limit ?? 50,
      skip: query.skip ?? 0,
    };
  },

  adminReview: async (adminId: string, recordId: string, action: string, reason?: string) => {
    const admin = await getUserOrThrow(adminId);
    assertAdmin(admin);

    const record = await VerificationRecordModel.findById(recordId);
    if (!record) throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');
    if (!['pending_review', 'scheduled'].includes(record.status)) {
      throw new AppError('Record is not pending review', 409, 'RECORD_NOT_PENDING');
    }

    let newStatus: VerificationStatus;
    let adminAction: 'approved' | 'rejected' | 'requested_more_info';
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        adminAction = 'approved';
        break;
      case 'reject':
        newStatus = 'rejected';
        adminAction = 'rejected';
        if (!reason) throw new AppError('Rejection reason is required', 400, 'VALIDATION_ERROR');
        break;
      case 'request_info':
        newStatus = 'pending_review';
        adminAction = 'requested_more_info';
        if (!reason) throw new AppError('Message is required when requesting more info', 400, 'VALIDATION_ERROR');
        break;
      default:
        throw new AppError('Invalid action', 400, 'VALIDATION_ERROR');
    }

    record.status = newStatus;
    record.reviewed_by = admin._id;
    record.reviewed_at = new Date();
    if (action === 'reject') record.rejection_reason = reason;
    await record.save();

    await AdminReviewModel.create({
      verification_record_id: record._id,
      admin_id: admin._id,
      action: adminAction,
      notes: reason,
    });

    const overallStatus = await recomputeOverallStatus(record.provider_id.toString());
    const provider = await UserModel.findById(record.provider_id);
    if (provider) {
      provider.set('overall_status', overallStatus);
      await provider.save();
    }

    return {
      record: serializeVerificationRecord(record.toJSON() as Record<string, unknown>),
      overall_status: overallStatus,
    };
  },

  getAuditTrail: async (adminId: string, recordId: string) => {
    const admin = await getUserOrThrow(adminId);
    assertAdmin(admin);

    const reviews = await AdminReviewModel.find({ verification_record_id: recordId })
      .sort({ created_at: -1 })
      .populate('admin_id', 'fullName email')
      .lean();

    return reviews.map((r) => ({
      id: r._id.toString(),
      admin: (r.admin_id as unknown as { fullName?: string; email?: string }) ?? null,
      action: r.action,
      notes: r.notes ?? null,
      created_at: r.created_at,
    }));
  },

  getAdminRecordDetail: async (adminId: string, recordId: string) => {
    const admin = await getUserOrThrow(adminId);
    assertAdmin(admin);

    const record = await VerificationRecordModel.findById(recordId)
      .populate('provider_id', 'fullName email phone')
      .populate('category_id', 'name job_type')
      .populate('skill_item_id', 'name')
      .lean();

    if (!record) throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');

    const reviews = await AdminReviewModel.find({ verification_record_id: recordId })
      .sort({ created_at: -1 })
      .populate('admin_id', 'fullName email')
      .lean();

    return {
      id: record._id.toString(),
      provider: (record.provider_id as unknown as Record<string, unknown>) ?? null,
      category: (record.category_id as unknown as Record<string, unknown>) ?? null,
      skill_item: (record.skill_item_id as unknown as Record<string, unknown>) ?? null,
      verification_track: record.verification_track,
      evidence_type: record.evidence_type,
      evidence_payload: record.evidence_payload,
      status: record.status,
      auto_check_result: record.auto_check_result ?? null,
      sla_due_at: record.sla_due_at ?? null,
      rejection_reason: record.rejection_reason ?? null,
      created_at: record.created_at,
      updated_at: record.updated_at,
      audit_trail: reviews.map((r) => ({
        id: r._id.toString(),
        admin: (r.admin_id as unknown as Record<string, unknown>) ?? null,
        action: r.action,
        notes: r.notes ?? null,
        created_at: r.created_at,
      })),
    };
  },

};

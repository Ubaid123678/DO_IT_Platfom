import { AppError } from '../../common/errors/AppError.js';
import UserModel, { type ProviderTrack } from '../auth/auth.model.js';
import KycDocumentModel from '../kyc/kyc.model.js';
import { verificationAutoService } from './verification-auto.service.js';
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

// ---------------------------------------------------------------------------
// Provider profile completion (per track)
// ---------------------------------------------------------------------------

// A provider is locked to a single track. Resolve it from the persisted category
// selection, falling back to the categories present in verification records.
const resolveProviderTrack = async (userId: string): Promise<ProviderTrack | null> => {
  const user = await UserModel.findById(userId);
  if (!user) return null;
  const json = user.toJSON() as Record<string, unknown>;
  let catIds = (json.categories_selected ?? []) as string[];
  if (catIds.length === 0) {
    catIds = (await VerificationRecordModel.distinct('category_id', { provider_id: userId })) as string[];
  }
  if (catIds.length === 0) return null;
  const cats = await SkillCategoryModel.find({ _id: { $in: catIds } }).lean();
  const tracks = new Set(cats.map((c) => c.job_type));
  if (tracks.size !== 1) return null;
  return Array.from(tracks)[0] as ProviderTrack;
};

// Errand service area is authoritative from the verified Trust Bundle — the
// profile mirrors it read-only rather than re-collecting it.
const loadErrandServiceArea = async (userId: string): Promise<{ city: string; radius_km: number } | null> => {
  const record = await VerificationRecordModel.findOne({
    provider_id: userId,
    verification_track: 'errand',
    status: { $in: ['approved', 'auto_approved', 'pending_review'] },
  })
    .sort({ created_at: -1 })
    .lean();
  const payload = record?.evidence_payload as { service_area?: { city?: string; radius_km?: number } } | undefined;
  const area = payload?.service_area;
  if (!area?.city) return null;
  return { city: area.city, radius_km: Number(area.radius_km) || 0 };
};

const errandRequiresVehicle = async (userId: string): Promise<boolean> => {
  const user = await UserModel.findById(userId);
  if (!user) return false;
  const json = user.toJSON() as Record<string, unknown>;
  const skillItemIds = (json.skill_items_selected ?? []) as string[];
  if (skillItemIds.length === 0) return false;
  const items = await SkillItemModel.find({ _id: { $in: skillItemIds } }).lean();
  return items.some((i) => i.requires_vehicle);
};

const hasValue = (val: unknown): boolean => {
  if (Array.isArray(val)) return val.length > 0;
  if (val && typeof val === 'object') return Object.keys(val as Record<string, unknown>).length > 0;
  return val !== undefined && val !== null && String(val).trim().length > 0;
};

const computeCompleteness = (
  track: ProviderTrack | null,
  profile: Record<string, unknown>,
  trackData: Record<string, unknown>,
): { completeness: number; missing_fields: string[] } => {
  const required: { label: string; done: boolean }[] = [];
  const optional: { label: string; done: boolean }[] = [];

  required.push({ label: 'Profile photo', done: hasValue(profile.avatar_url) });
  required.push({ label: 'Headline', done: hasValue(profile.headline) });
  required.push({ label: 'Bio', done: hasValue(profile.bio) });
  required.push({ label: 'Languages', done: hasValue(profile.languages) });
  required.push({ label: 'City', done: hasValue(profile.city) });
  required.push({ label: 'Availability', done: hasValue(profile.availability) });

  if (track === 'physical') {
    const td = (trackData.physical ?? {}) as Record<string, unknown>;
    required.push({ label: 'Years of experience', done: hasValue(td.years_experience) });
    required.push({ label: 'Service radius', done: hasValue(td.service_radius_km) });
    required.push({ label: 'Tools & equipment', done: hasValue(td.tools_equipment) });
    required.push({ label: 'Hourly rate', done: hasValue(td.hourly_rate) });
    required.push({ label: 'On-site availability', done: hasValue(td.on_site_availability) });
    optional.push({ label: 'Team size', done: hasValue(td.team_size) });
    optional.push({ label: 'Insurance', done: hasValue(td.insurance) });
    optional.push({ label: 'Transport', done: hasValue(td.has_transport) });
  } else if (track === 'digital') {
    const td = (trackData.digital ?? {}) as Record<string, unknown>;
    required.push({ label: 'Skills', done: hasValue(td.skills) });
    required.push({ label: 'Tech stack', done: hasValue(td.tech_stack) });
    required.push({ label: 'Hourly rate', done: hasValue(td.hourly_rate) });
    required.push({ label: 'Timezone', done: hasValue(td.timezone) });
    required.push({ label: 'English proficiency', done: hasValue(td.english_proficiency) });
    required.push({ label: 'Work history', done: hasValue(td.work_history) });
    optional.push({ label: 'Project rate', done: hasValue(td.project_rate) });
    optional.push({ label: 'Education', done: hasValue(td.education) });
    optional.push({ label: 'Resume', done: hasValue(td.resume_file_url) });
  } else if (track === 'errand') {
    const td = (trackData.errand ?? {}) as Record<string, unknown>;
    required.push({ label: 'Service area', done: hasValue(td.service_area) });
    required.push({ label: 'Transport mode', done: hasValue(td.transport_mode) });
    required.push({ label: 'Base fee', done: hasValue(td.base_fee) });
    required.push({ label: 'Per-km fee', done: hasValue(td.per_km_fee) });
    required.push({ label: 'Working hours', done: hasValue(td.working_hours) });
    optional.push({ label: 'Max payload', done: hasValue(td.max_payload_kg) });
    optional.push({ label: 'Same-day express', done: hasValue(td.same_day_express) });
    optional.push({ label: 'Goods insurance', done: hasValue(td.goods_insurance) });
  }

  const requiredDone = required.filter((r) => r.done).length;
  const optionalDone = optional.filter((o) => o.done).length;
  const requiredTotal = required.length || 1;
  const optionalTotal = optional.length || 1;

  const completeness = Math.min(
    100,
    Math.max(0, Math.round((requiredDone / requiredTotal) * 60 + (optionalDone / optionalTotal) * 40)),
  );

  return { completeness, missing_fields: required.filter((r) => !r.done).map((r) => r.label) };
};

const serializeProviderProfile = (user: { toJSON?: () => Record<string, unknown> } | null, track: ProviderTrack | null) => {
  const json = user?.toJSON?.() ?? {};
  const profile = (json.provider_profile ?? {}) as Record<string, unknown>;
  const trackData = (json.track_data ?? {}) as Record<string, unknown>;

  // Surface availability from the track mirror (working_hours / on_site_availability)
  // when the universal availability isn't stored yet (legacy/partial saves) so the
  // client always receives a consistent `provider_profile.availability`.
  if (!hasValue(profile.availability) && track) {
    const td = (trackData[track] ?? {}) as Record<string, unknown>;
    const mirror = track === 'errand' ? td.working_hours : track === 'physical' ? td.on_site_availability : undefined;
    if (hasValue(mirror)) profile.availability = mirror;
  }

  const { completeness, missing_fields } = computeCompleteness(track, profile, trackData);
  return {
    provider_profile: profile,
    track,
    track_data: trackData,
    completeness,
    missing_fields,
  };
};

const serializePublicProfile = async (provider: unknown, providerUserId: string) => {
  const json = (provider as { toJSON: () => Record<string, unknown> }).toJSON();
  const profile = (json.provider_profile ?? {}) as Record<string, unknown>;
  const track = await resolveProviderTrack(providerUserId);
  const trackData = (json.track_data ?? {}) as Record<string, unknown>;
  const activeTrackData = track ? { [track]: trackData[track] ?? {} } : {};

  const selectedIds = (json.categories_selected ?? []) as string[];
  const categories = await SkillCategoryModel.find({ _id: { $in: selectedIds } }).lean();

  return {
    user_id: providerUserId,
    full_name: json.fullName ?? null,
    avatar_url: profile.avatar_url ?? null,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    languages: profile.languages ?? [],
    city: profile.city ?? null,
    track,
    overall_status: json.overall_status ?? 'incomplete',
    categories: categories.map((c) => ({ id: c._id.toString(), name: c.name, job_type: c.job_type })),
    track_data: activeTrackData,
  };
};

const errandMotorizedModes = ['motorbike', 'car', 'van'];

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
  let selectedCategoryIds = (providerData.categories_selected ?? []) as string[];

  // Fall back to the categories present in submitted verification records so the
  // overall status stays accurate even if the provider never persisted a selection.
  if (selectedCategoryIds.length === 0) {
    selectedCategoryIds = await VerificationRecordModel.distinct('category_id', { provider_id: providerId });
  }

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

const supersedePreviousEvidence = async (
  providerId: string,
  categoryId: string,
  skillItemId: string | undefined,
  evidenceType: string,
): Promise<void> => {
  const filter: Record<string, unknown> = {
    provider_id: providerId,
    category_id: categoryId,
    evidence_type: evidenceType,
    status: { $in: ['rejected', 'pending_review'] },
  };
  if (skillItemId) filter.skill_item_id = skillItemId;
  await VerificationRecordModel.deleteMany(filter);
};

// Errand Trust Bundle rules: a background/character check is always required and
// vehicle documents become mandatory whenever any selected skill needs a vehicle.
const assertErrandBundleRequirements = async (
  categoryId: string,
  payload: Record<string, unknown>,
  skillItemId?: string,
): Promise<void> => {
  const backgroundCheck = Array.isArray(payload.background_check) ? payload.background_check : [];
  if (backgroundCheck.length === 0) {
    throw new AppError('A background/character check is required for errand verification', 400, 'VALIDATION_ERROR');
  }

  const serviceArea = payload.service_area as { city?: string } | undefined;
  if (!serviceArea?.city || !String(serviceArea.city).trim()) {
    throw new AppError('Service area is required for errand verification', 400, 'VALIDATION_ERROR');
  }

  const payloadIds = Array.isArray(payload.skill_item_ids)
    ? (payload.skill_item_ids as string[]).filter((id): id is string => typeof id === 'string')
    : [];
  const ids = payloadIds.length > 0 ? payloadIds : skillItemId ? [skillItemId] : [];
  let requiresVehicle = false;
  if (ids.length > 0) {
    const items = await SkillItemModel.find({ _id: { $in: ids } }).lean();
    requiresVehicle = items.some((i) => i.requires_vehicle);
  } else {
    const items = await SkillItemModel.find({ category_id: categoryId }).lean();
    requiresVehicle = items.some((i) => i.requires_vehicle);
  }

  const vehicleDocs = Array.isArray(payload.vehicle_docs) ? payload.vehicle_docs : [];
  if (requiresVehicle && vehicleDocs.length === 0) {
    throw new AppError('Vehicle documents are required because one of your selected skills requires a vehicle', 400, 'VALIDATION_ERROR');
  }
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
      requires_vehicle: item.requires_vehicle,
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

    const trackSet = new Set(existingCats.map((c) => c.job_type));
    if (trackSet.size > 1) {
      throw new AppError('Select categories from a single track (physical, digital, or errand)', 400, 'TRACK_MIX_NOT_ALLOWED');
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
    input: { category_id: string; skill_item_id?: string; evidence_type: EvidenceType; evidence_payload: Record<string, unknown> },
  ) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const category = await SkillCategoryModel.findById(input.category_id);
    if (!category || !category.active) throw new AppError('Category not found or inactive', 404, 'CATEGORY_NOT_FOUND');

    const isBundle = input.evidence_type === 'digital' || input.evidence_type === 'physical' || input.evidence_type === 'errand';

    if (input.skill_item_id && !isBundle) {
      const skillItem = await SkillItemModel.findById(input.skill_item_id);
      if (!skillItem || !skillItem.active) throw new AppError('Skill item not found or inactive', 404, 'SKILL_ITEM_NOT_FOUND');
    }

    if (category.job_type === 'errand') {
      await assertErrandBundleRequirements(input.category_id, input.evidence_payload, input.skill_item_id);
    }

    await supersedePreviousEvidence(userId, input.category_id, input.skill_item_id, input.evidence_type);

    const slaDueAt = new Date();
    slaDueAt.setHours(slaDueAt.getHours() + (category.sla_hours || 48));

    const record = await VerificationRecordModel.create({
      provider_id: userId,
      category_id: input.category_id,
      skill_item_id: input.skill_item_id || undefined,
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
    input: { evidence_batch: { category_id: string; skill_item_id?: string; evidence_type: EvidenceType; evidence_payload: Record<string, unknown> }[] },
  ) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    // A batch submission covers the categories being (re)submitted. Clear prior
    // rejected records only for those categories so a scoped resubmission doesn't
    // wipe rejection records of other categories the provider hasn't resubmitted.
    const batchCategoryIds = input.evidence_batch.map((item) => item.category_id);
    await VerificationRecordModel.deleteMany({
      provider_id: userId,
      status: 'rejected',
      category_id: { $in: batchCategoryIds },
    });

    const createdRecords = [];
    for (const item of input.evidence_batch) {
      const category = await SkillCategoryModel.findById(item.category_id);
      if (!category || !category.active) {
        throw new AppError(`Category ${item.category_id} not found or inactive`, 404, 'CATEGORY_NOT_FOUND');
      }

      const isBundle = item.evidence_type === 'digital' || item.evidence_type === 'physical' || item.evidence_type === 'errand';

      if (item.skill_item_id && !isBundle) {
        const skillItem = await SkillItemModel.findById(item.skill_item_id);
        if (!skillItem || !skillItem.active) {
          throw new AppError(`Skill item ${item.skill_item_id} not found or inactive`, 404, 'SKILL_ITEM_NOT_FOUND');
        }
      }

      if (item.evidence_type === 'errand') {
        await assertErrandBundleRequirements(item.category_id, item.evidence_payload);
      }

      if (isBundle) {
        // One record per category bundles all evidence + skills. Clear every prior
        // rejected/pending record for the category (including legacy per-skill
        // records) so a category never holds multiple review docs that collide.
        await VerificationRecordModel.deleteMany({
          provider_id: userId,
          category_id: item.category_id,
          status: { $in: ['rejected', 'pending_review'] },
        });
      } else {
        await supersedePreviousEvidence(userId, item.category_id, item.skill_item_id, item.evidence_type);
      }

      const slaDueAt = new Date();
      slaDueAt.setHours(slaDueAt.getHours() + (category.sla_hours || 48));

      const record = await VerificationRecordModel.create({
        provider_id: userId,
        category_id: item.category_id,
        skill_item_id: item.skill_item_id || undefined,
        verification_track: category.job_type,
        evidence_type: item.evidence_type,
        evidence_payload: item.evidence_payload,
        status: 'pending_review',
        sla_due_at: slaDueAt,
        created_at: new Date(),
      });

      createdRecords.push(serializeVerificationRecord(record.toJSON() as Record<string, unknown>));
    }

    await verificationAutoService.persistOAuthFromBatch(userId, input.evidence_batch);

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

    return records.map((r) => {
      const catRef = r.category_id as unknown as { _id?: unknown; name?: string; job_type?: string } | null;
      const skillRef = r.skill_item_id as unknown as { _id?: unknown; name?: string } | null;
      return {
        id: r._id.toString(),
        category_id: String(catRef?._id ?? r.category_id),
        category: catRef?.name ?? null,
        category_job_type: catRef?.job_type ?? null,
        skill_item_id: skillRef?._id != null ? String(skillRef._id) : null,
        skill_item: skillRef?.name ?? null,
        evidence_type: r.evidence_type,
        status: r.status,
        sla_due_at: r.sla_due_at ?? null,
        rejection_reason: r.rejection_reason ?? null,
        created_at: r.created_at,
      };
    });
  },

  getRecordDetail: async (userId: string, recordId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const record = await VerificationRecordModel.findOne({ _id: recordId, provider_id: userId })
      .populate('category_id', 'name job_type')
      .populate('skill_item_id', 'name')
      .lean();

    if (!record) throw new AppError('Verification record not found', 404, 'RECORD_NOT_FOUND');

    const catRef = record.category_id as unknown as { _id?: unknown; name?: string; job_type?: string } | null;
    const skillRef = record.skill_item_id as unknown as { _id?: unknown; name?: string } | null;

    return {
      id: record._id.toString(),
      category_id: String(catRef?._id ?? record.category_id),
      category: catRef?.name ?? null,
      category_job_type: catRef?.job_type ?? null,
      skill_item_id: skillRef?._id != null ? String(skillRef._id) : null,
      skill_item: skillRef?.name ?? null,
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
    if (existing.verification_track === 'errand' || existing.evidence_type === 'errand') {
      await assertErrandBundleRequirements(
        existing.category_id.toString(),
        input.evidence_payload,
        existing.skill_item_id?.toString(),
      );
    }

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

  updateProfile: async (
    userId: string,
    profileData: { provider_profile?: Record<string, unknown>; track_data?: Record<string, unknown> },
  ) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    const track = await resolveProviderTrack(userId);
    const profileInput = (profileData.provider_profile ?? {}) as Record<string, unknown>;
    const trackInput = (profileData.track_data ?? {}) as Record<string, unknown>;

    // Universal profile fields (identity + presentation layer).
    // Reassign the object under provider_profile so the Mixed-path change is
    // detected (in-place mutation of user.get() output is silently dropped).
    const currentProfileRaw = (user.get('provider_profile') ?? {}) as Record<string, unknown>;
    const currentProfile = { ...currentProfileRaw };
    for (const key of ['avatar_url', 'headline', 'bio', 'languages', 'city', 'availability', 'public_profile']) {
      if (profileInput[key] !== undefined) currentProfile[key] = profileInput[key];
    }
    user.set('provider_profile', currentProfile);
    user.markModified('provider_profile');
    if (currentProfile.public_profile !== undefined) {
      user.set('public_profile', currentProfile.public_profile);
    }

    // Track-scoped data — only the provider's active track is writable.
    if (track) {
      const offTrack = Object.keys(trackInput).filter((k) => k !== track);
      if (offTrack.length > 0) {
        throw new AppError(
          `Profile data for "${offTrack.join(', ')}" is not allowed for your verified track (${track})`,
          400,
          'TRACK_MISMATCH',
        );
      }

      const currentTrackData = (user.get('track_data') ?? {}) as Record<string, unknown>;
      const incoming = (trackInput[track] ?? {}) as Record<string, unknown>;

      if (track === 'errand' && incoming.transport_mode !== undefined) {
        const mode = String(incoming.transport_mode);
        if ((await errandRequiresVehicle(userId)) && !errandMotorizedModes.includes(mode)) {
          throw new AppError(
            'Your selected errand skills require a vehicle. Transport mode must be motorbike, car, or van.',
            400,
            'VALIDATION_ERROR',
          );
        }
      }

      const merged = { ...((currentTrackData[track] as Record<string, unknown>) ?? {}), ...incoming };
      if (track === 'errand') {
        const verifiedArea = await loadErrandServiceArea(userId);
        if (verifiedArea) merged.service_area = verifiedArea;
      }
      user.set('track_data', { ...currentTrackData, [track]: merged });
      user.set('track', track);

      // Mirror track availability back into the universal profile field so both
      // stay in sync even if the client only sent one of them.
      if (track === 'errand' || track === 'physical') {
        const mirrorKey = track === 'errand' ? 'working_hours' : 'on_site_availability';
        const mirror = merged[mirrorKey];
        if (hasValue(mirror) && !hasValue(currentProfile.availability)) {
          currentProfile.availability = mirror;
          user.set('provider_profile', currentProfile);
        }
      }
    } else if (Object.keys(trackInput).length > 0) {
      throw new AppError('Select and verify your categories before completing track-specific profile data', 400, 'VALIDATION_ERROR');
    }

    await user.save();
    return serializeProviderProfile(user, track);
  },

  getProfile: async (userId: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);
    const track = await resolveProviderTrack(userId);
    return serializeProviderProfile(user, track);
  },

  getPublicProfile: async (viewerId: string | undefined, providerUserId: string) => {
    const provider = await UserModel.findById(providerUserId);
    if (!provider) throw new AppError('Provider not found', 404, 'PROVIDER_NOT_FOUND');
    if (provider.role !== 'provider') throw new AppError('Profile is not a provider', 400, 'NOT_PROVIDER');

    const json = provider.toJSON() as Record<string, unknown>;
    const profile = (json.provider_profile ?? {}) as Record<string, unknown>;
    if (profile.public_profile === false && viewerId !== providerUserId) {
      throw new AppError('This profile is private', 403, 'PROFILE_PRIVATE');
    }

    return serializePublicProfile(provider, providerUserId);
  },

  uploadResumeFile: async (userId: string, fileUrl: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    // Mirror the resume into the digital track data so completeness scoring sees it.
    const trackData = (user.get('track_data') ?? {}) as Record<string, unknown>;
    const digital = { ...((trackData.digital as Record<string, unknown>) ?? {}), resume_file_url: fileUrl };
    user.set('track_data', { ...trackData, digital });

    user.set('resume_file_url', fileUrl);
    await user.save();

    const result = await ResumeParseResultModel.create({
      provider_id: userId,
      source_file_url: fileUrl,
      applied: false,
    });

    return { resume_file_url: fileUrl, parse_result_id: result._id.toString() };
  },

  uploadAvatarFile: async (userId: string, fileUrl: string) => {
    const user = await getUserOrThrow(userId);
    assertProviderOrAdmin(user);

    // provider_profile / track_data are Schema.Types.Mixed — Mutating the object
    // returned by user.get() in place leaves the path undetected by Mongoose's
    // change tracking, so save() silently skips it. markModified forces the write.
    const profile = (user.get('provider_profile') ?? {}) as Record<string, unknown>;
    profile.avatar_url = fileUrl;
    user.set('provider_profile', profile);
    user.markModified('provider_profile');
    await user.save();

    const track = await resolveProviderTrack(userId);
    return serializeProviderProfile(user, track);
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
    const currentStatus = (json.overall_status as OverallStatus) ?? 'incomplete';

    // Recompute from the actual records on every read so approvals/rejections are
    // reflected immediately (e.g. while the provider polls from the pending screen).
    const overallStatus = await recomputeOverallStatus(userId);
    if (currentStatus !== overallStatus) {
      user.set('overall_status', overallStatus);
      await user.save();
    }

    const records = await VerificationRecordModel.find({ provider_id: userId })
      .populate('category_id', 'name job_type')
      .lean();

    const categoryMap = new Map<string, { name: string; jobType: string; statuses: Set<VerificationStatus>; rejectionReason?: string }>();
    for (const r of records) {
      const catRef = r.category_id as unknown as { _id?: unknown; name?: string; job_type?: string } | null;
      const catId = String(catRef?._id ?? r.category_id);
      const catName = catRef?.name ?? 'Unknown';
      const jobType = catRef?.job_type ?? (r.verification_track ?? 'digital');
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { name: catName, jobType, statuses: new Set() });
      }
      const data = categoryMap.get(catId)!;
      data.statuses.add(r.status);
      if (r.status === 'rejected' && r.rejection_reason) {
        data.rejectionReason = r.rejection_reason;
      }
    }

    const categories = Array.from(categoryMap.entries()).map(([id, data]) => {
      const statuses = Array.from(data.statuses);
      let catStatus: string;
      if (statuses.some((s) => ['approved', 'auto_approved'].includes(s))) catStatus = 'verified';
      else if (statuses.includes('rejected')) catStatus = 'rejected';
      else if (statuses.includes('pending_review')) catStatus = 'pending';
      else catStatus = 'incomplete';
      return {
        category_id: id,
        category_name: data.name,
        job_type: data.jobType,
        status: catStatus,
        rejection_reason: data.rejectionReason ?? null,
      };
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

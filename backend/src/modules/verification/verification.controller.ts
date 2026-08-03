import type { Response } from 'express';

import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { verificationAutoService } from './verification-auto.service.js';
import { verificationService } from './verification.service.js';
import { verificationValidators } from './verification.validation.js';
import { enqueueCredentialUrlVerification } from './verification.worker.js';

const validate = <T>(schema: { validate: (value: unknown) => { error?: { message: string }; value: T } }, payload: unknown): T => {
  const result = schema.validate(payload);
  if (result.error) throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  return result.value;
};

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.userId;
};

export const verificationController = {
  listCategories: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = validate(verificationValidators.queryCategories, req.query);
    const categories = await verificationService.listCategories(query.job_type, query.active_only);
    res.status(200).json({ success: true, data: { categories }, meta: { message: 'Categories fetched successfully' } });
  }),

  listSkillItems: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { categoryId } = req.params;
    const items = await verificationService.listSkillItems(categoryId);
    res.status(200).json({ success: true, data: { skill_items: items }, meta: { message: 'Skill items fetched successfully' } });
  }),

  selectCategories: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.selectCategories, req.body);
    const result = await verificationService.selectCategories(userId, payload);
    res.status(200).json({ success: true, data: result, meta: { message: 'Categories selected successfully' } });
  }),

  getSelectedCategories: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const result = await verificationService.getSelectedCategories(userId);
    res.status(200).json({ success: true, data: result, meta: { message: 'Selected categories fetched successfully' } });
  }),

  submitEvidence: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.submitEvidence, req.body);
    const record = await verificationService.submitEvidence(userId, payload);
    res.status(201).json({ success: true, data: { record }, meta: { message: 'Evidence submitted successfully' } });
  }),

  submitBatchEvidence: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.submitBatchEvidence, req.body);
    const records = await verificationService.submitBatchEvidence(userId, payload);
    res.status(201).json({ success: true, data: { records }, meta: { message: 'All evidence submitted for review successfully' } });
  }),

  listMyRecords: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const records = await verificationService.listMyRecords(userId);
    res.status(200).json({ success: true, data: { records }, meta: { message: 'Records fetched successfully' } });
  }),

  getRecordDetail: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const record = await verificationService.getRecordDetail(userId, req.params.recordId);
    res.status(200).json({ success: true, data: record, meta: { message: 'Record detail fetched successfully' } });
  }),

  resubmitEvidence: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.resubmitEvidence, req.body);
    const record = await verificationService.resubmitEvidence(userId, req.params.recordId, payload);
    res.status(201).json({ success: true, data: { record }, meta: { message: 'Evidence resubmitted successfully' } });
  }),

  getVerificationStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const status = await verificationService.getVerificationStatus(userId);
    res.status(200).json({ success: true, data: status, meta: { message: 'Verification status fetched successfully' } });
  }),

  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.updateProfile, req.body);
    const profile = await verificationService.updateProfile(userId, payload);
    res.status(200).json({ success: true, data: profile, meta: { message: 'Profile updated successfully' } });
  }),

  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const profile = await verificationService.getProfile(userId);
    res.status(200).json({ success: true, data: profile, meta: { message: 'Profile fetched successfully' } });
  }),

  uploadResume: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    if (!req.file) throw new AppError('Resume file is required', 400, 'VALIDATION_ERROR');
    const fileUrl = `/uploads/resume/${req.file.filename}`;
    const result = await verificationService.uploadResumeFile(userId, fileUrl);
    res.status(201).json({ success: true, data: result, meta: { message: 'Resume uploaded successfully' } });
  }),

  connectGithub: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.connectOAuth, req.body);
    const result = await verificationAutoService.connectOAuthPlatform(
      userId,
      'github',
      payload.username,
      payload.skill_keywords,
    );
    res.status(200).json({ success: true, data: result, meta: { message: 'GitHub account connected successfully' } });
  }),

  getConnectedAccounts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const accounts = await verificationAutoService.getConnectedAccounts(userId);
    res.status(200).json({ success: true, data: { accounts }, meta: { message: 'Connected accounts fetched successfully' } });
  }),

  verifyPortfolio: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const payload = validate(verificationValidators.verifyPortfolio, req.body);
    const result = await verificationAutoService.verifyPortfolioUrl(payload.url);
    res.status(200).json({ success: true, data: result, meta: { message: 'Portfolio link checked successfully' } });
  }),

  submitEvidenceWithAutoVerify: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(verificationValidators.submitEvidence, req.body);
    const record = await verificationService.submitEvidence(userId, payload) as { id: string };

    const evidencePayload = payload.evidence_payload;
    const urlToCheck = (evidencePayload?.url as string) || (evidencePayload?.credential_url as string);
    if (urlToCheck) {
      await enqueueCredentialUrlVerification(record.id, urlToCheck);
    }

    res.status(201).json({ success: true, data: { record }, meta: { message: 'Evidence submitted with auto-verification queued' } });
  }),

  getResumeParseResult: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const result = await verificationService.getResumeParseResult(userId, req.params.resultId);
    res.status(200).json({ success: true, data: result, meta: { message: 'Parse result fetched successfully' } });
  }),

  listForAdmin: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = getUserId(req);
    const query = validate(verificationValidators.adminListQuery, req.query);
    const result = await verificationService.listForAdmin(adminId, query);
    res.status(200).json({ success: true, data: result, meta: { message: 'Admin records fetched successfully' } });
  }),

  adminReview: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = getUserId(req);
    const payload = validate(verificationValidators.adminReview, req.body);
    const result = await verificationService.adminReview(adminId, req.params.recordId, payload.action, payload.reason);
    res.status(200).json({ success: true, data: result, meta: { message: `Record ${payload.action === 'approve' ? 'approved' : payload.action === 'reject' ? 'rejected' : 'updated'} successfully` } });
  }),

  getAuditTrail: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = getUserId(req);
    const trail = await verificationService.getAuditTrail(adminId, req.params.recordId);
    res.status(200).json({ success: true, data: { audit_trail: trail }, meta: { message: 'Audit trail fetched successfully' } });
  }),

  getAdminRecordDetail: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const adminId = getUserId(req);
    const detail = await verificationService.getAdminRecordDetail(adminId, req.params.recordId);
    res.status(200).json({ success: true, data: detail, meta: { message: 'Record detail fetched successfully' } });
  }),


};

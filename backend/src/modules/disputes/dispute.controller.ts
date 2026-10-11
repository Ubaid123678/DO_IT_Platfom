import type { Response } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { disputeService } from './dispute.service.js';
import { disputeValidators } from './dispute.validation.js';
import { DisputeModel } from './dispute.model.js';

const validate = <T>(
  schema: { validate: (value: unknown) => { error?: { message: string }; value: T } },
  payload: unknown
): T => {
  const result = schema.validate(payload);
  if (result.error) throw new AppError(result.error.message, 400, 'VALIDATION_ERROR');
  return result.value;
};

const getUserId = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.userId;
};

const getUserRole = (req: AuthenticatedRequest): string => {
  if (!req.auth) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  return req.auth.role;
};

export const disputeController = {
  createDispute: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(disputeValidators.createDispute, req.body);
    const dispute = await disputeService.createDispute({ ...payload, raisedByUserId: userId });
    res.status(201).json({
      success: true,
      data: { dispute },
      meta: { message: 'Dispute created successfully' },
    });
  }),

  submitEvidence: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(disputeValidators.submitEvidence, req.body);
    const dispute = await disputeService.submitEvidence({ disputeId: req.params.disputeId, userId, evidence: payload.evidence });
    res.status(200).json({
      success: true,
      data: { dispute },
      meta: { message: 'Evidence submitted successfully' },
    });
  }),

  addEvidence: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const payload = validate(disputeValidators.addEvidence, req.body);
    const dispute = await disputeService.submitEvidence({ disputeId: req.params.disputeId, userId, evidence: [payload.evidence] });
    res.status(200).json({
      success: true,
      data: { dispute },
      meta: { message: 'Evidence added successfully' },
    });
  }),

  getDisputeById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const dispute = await disputeService.getDisputeById(req.params.disputeId, userId);
    res.status(200).json({
      success: true,
      data: { dispute },
      meta: { message: 'Dispute fetched successfully' },
    });
  }),

  getDisputes: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const query = validate(disputeValidators.getDisputes, req.query);
    const result = await disputeService.getDisputes(userId, query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Disputes fetched successfully' },
    });
  }),

  getDisputeStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const stats = await disputeService.getDisputeStats(userId);
    res.status(200).json({
      success: true,
      data: { stats },
      meta: { message: 'Dispute statistics fetched successfully' },
    });
  }),

  // Admin endpoints
  getDisputesForAdmin: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }
    const query = validate(disputeValidators.getDisputes, req.query);
    const result = await disputeService.getDisputesForAdmin(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Admin disputes fetched successfully' },
    });
  }),

  resolveDispute: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }
    const adminId = getUserId(req);
    const payload = validate(disputeValidators.resolveDispute, req.body);
    const dispute = await disputeService.resolveDispute({ disputeId: req.params.disputeId, adminId, ...payload });
    res.status(200).json({
      success: true,
      data: { dispute },
      meta: { message: 'Dispute resolved successfully' },
    });
  }),

  extendEvidenceDeadline: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }
    const payload = validate(disputeValidators.extendEvidenceDeadline, req.body);
    const dispute = await disputeService.extendEvidenceDeadline({ disputeId: req.params.disputeId, days: payload.days });
    res.status(200).json({
      success: true,
      data: { dispute },
      meta: { message: 'Evidence deadline extended successfully' },
    });
  }),

  getDisputeByIdForAdmin: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') {
      throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    }
    const dispute = await DisputeModel.findById(req.params.disputeId)
      .populate('jobId', 'title status client provider')
      .populate('proposalId', 'title')
      .populate('raisedByUserId', 'fullName email')
      .populate('againstUserId', 'fullName email')
      .populate('evidence.submittedBy', 'fullName')
      .populate('verdict.decidedBy', 'fullName')
      .lean();

    if (!dispute) throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');

    res.status(200).json({
      success: true,
      data: { dispute },
      meta: { message: 'Dispute fetched successfully' },
    });
  }),
};
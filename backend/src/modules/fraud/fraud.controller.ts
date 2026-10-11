import type { Response } from 'express';
import Joi from 'joi';
import { AppError } from '../../common/errors/AppError.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { fraudService } from './fraud.service.js';
import { fraudValidators } from './fraud.validation.js';

const validate = <T>(
  schema: Joi.ObjectSchema<T>,
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

export const fraudController = {
  // Fraud Rules
  createFraudRule: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const _userId = getUserId(req);
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.createFraudRule, req.body);
    const rule = await fraudService.createFraudRule(payload);
    res.status(201).json({
      success: true,
      data: { rule },
      meta: { message: 'Fraud rule created successfully' },
    });
  }),

  getFraudRules: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const query = validate(fraudValidators.getFraudRules, req.query);
    const rules = await fraudService.getFraudRules(query);
    res.status(200).json({
      success: true,
      data: { rules },
      meta: { message: 'Fraud rules fetched successfully' },
    });
  }),

  getFraudRuleById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { ruleId } = validate(fraudValidators.getFraudRuleById, req.params);
    const rule = await fraudService.getFraudRuleById(ruleId);
    res.status(200).json({
      success: true,
      data: { rule },
      meta: { message: 'Fraud rule fetched successfully' },
    });
  }),

  updateFraudRule: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { ruleId } = req.params;
    const payload = validate(fraudValidators.updateFraudRule, req.body);
    const rule = await fraudService.updateFraudRule(ruleId, payload);
    res.status(200).json({
      success: true,
      data: { rule },
      meta: { message: 'Fraud rule updated successfully' },
    });
  }),

  deleteFraudRule: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { ruleId } = req.params;
    await fraudService.deleteFraudRule(ruleId);
    res.status(200).json({
      success: true,
      data: { success: true },
      meta: { message: 'Fraud rule deleted successfully' },
    });
  }),

  // Fraud Flags
  getFraudFlags: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    const query = validate(fraudValidators.getFraudFlags, req.query);
    
    if (userRole !== 'admin') {
      query.userId = userId;
    }
    
    const result = await fraudService.getFraudFlags(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Fraud flags fetched successfully' },
    });
  }),

  getFraudFlagById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    const { flagId } = req.params;
    
    const flag = await fraudService.getFraudFlagById(flagId, userId, userRole);
    res.status(200).json({
      success: true,
      data: { flag },
      meta: { message: 'Fraud flag fetched successfully' },
    });
  }),

  submitEvidence: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserId(req);
    const { flagId } = req.params;
    const payload = validate(fraudValidators.submitEvidence, req.body);
    const flag = await fraudService.submitEvidence(flagId, userId, payload.evidence);
    res.status(200).json({
      success: true,
      data: { flag },
      meta: { message: 'Evidence submitted successfully' },
    });
  }),

  // Review Fraud Flag (Admin)
  reviewFraudFlag: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { flagId } = req.params;
    const payload = validate(fraudValidators.reviewFraudFlag, req.body);
    const flag = await fraudService.reviewFraudFlag(flagId, req.auth!.userId, payload);
    res.status(200).json({
      success: true,
      data: { flag },
      meta: { message: 'Fraud flag reviewed successfully' },
    });
  }),

  // Bulk review
  bulkReviewFlags: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.bulkUpdateFlags, req.body);
    const result = await fraudService.bulkReviewFlags(payload.flagIds, payload.action, payload.reviewNotes);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Flags updated successfully' },
    });
  }),

  // Fraud Cases
  getFraudCases: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const query = validate(fraudValidators.getFraudCases, req.query);
    const result = await fraudService.getFraudCases(query);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Fraud cases fetched successfully' },
    });
  }),

  getFraudCaseById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { caseId } = req.params;
    const caseData = await fraudService.getFraudCaseById(caseId);
    res.status(200).json({
      success: true,
      data: { case: caseData },
      meta: { message: 'Fraud case fetched successfully' },
    });
  }),

  updateFraudCase: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { caseId } = req.params;
    const payload = validate(fraudValidators.updateFraudCase, req.body);
    const caseData = await fraudService.updateFraudCase(caseId, payload);
    res.status(200).json({
      success: true,
      data: { case: caseData },
      meta: { message: 'Fraud case updated successfully' },
    });
  }),

  resolveFraudCase: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { caseId } = req.params;
    const payload = validate(fraudValidators.resolveFraudCase, req.body);
    const caseData = await fraudService.resolveFraudCase(caseId, req.auth!.userId, payload);
    res.status(200).json({
      success: true,
      data: { case: caseData },
      meta: { message: 'Fraud case resolved successfully' },
    });
  }),

  // Admin Actions
  applyFraudAction: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const { flagId } = req.params;
    const payload = validate(fraudValidators.applyFraudAction, req.body);
    const flag = await fraudService.applyFraudAction(flagId, payload.action, payload.reason);
    res.status(200).json({
      success: true,
      data: { flag },
      meta: { message: `Action ${payload.action} applied successfully` },
    });
  }),

  blockIp: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.blockIp, req.body);
    const result = await fraudService.blockIp(payload.ip, payload.reason, payload.duration);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'IP blocked successfully' },
    });
  }),

  blockDevice: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.blockDevice, req.body);
    const result = await fraudService.blockDevice(payload.deviceId, payload.reason, payload.duration);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Device blocked successfully' },
    });
  }),

  lockAccount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.lockAccount, req.body);
    const result = await fraudService.lockAccount(payload.userId, payload.reason, payload.duration);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Account locked successfully' },
    });
  }),

  require2fa: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.require2fa, req.body);
    const result = await fraudService.require2fa(payload.userId, payload.reason);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: '2FA requirement enabled successfully' },
    });
  }),

  notifyUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.notifyUser, req.body);
    const result = await fraudService.notifyUser(payload.userId, payload.title, payload.message, payload.channels);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'User notified successfully' },
    });
  }),

  notifyAdmin: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.notifyAdmin, req.body);
    const result = await fraudService.notifyAdmin(payload.title, payload.message, payload.priority, payload.recipients);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Admin notified successfully' },
    });
  }),

  // Statistics
  getFraudStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const query = validate(fraudValidators.getFraudStats, req.query);
    const stats = await fraudService.getFraudStats(query);
    res.status(200).json({
      success: true,
      data: { stats },
      meta: { message: 'Fraud statistics fetched successfully' },
    });
  }),

  // Admin bulk actions
  bulkUpdateFlags: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.bulkUpdateFlags, req.body);
    const result = await fraudService.bulkUpdateFlags(payload.flagIds, payload.action, payload.reviewNotes);
    res.status(200).json({
      success: true,
      data: result,
      meta: { message: 'Flags updated successfully' },
    });
  }),

  // Export
  exportFraudFlags: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = getUserRole(req);
    if (userRole !== 'admin') throw new AppError('Admin access required', 403, 'ADMIN_REQUIRED');
    
    const payload = validate(fraudValidators.exportFraudFlags, req.query);
    const data = await fraudService.exportFraudFlags(payload.startDate, payload.endDate, payload.format, payload.fields);
    res.status(200).json({
      success: true,
      data: data,
      meta: { message: 'Fraud flags exported successfully' },
    });
  }),
};
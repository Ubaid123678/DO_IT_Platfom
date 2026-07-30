import { Router } from 'express';

import { handleResumeUpload } from '../../common/utils/upload.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorization.middleware.js';
import { verificationController } from './verification.controller.js';

const verificationRouter = Router();

verificationRouter.get('/categories', verificationController.listCategories);
verificationRouter.get('/categories/:categoryId/skill-items', verificationController.listSkillItems);

verificationRouter.post('/categories', authenticate, requireRoles('provider', 'admin'), verificationController.selectCategories);
verificationRouter.get('/categories', authenticate, requireRoles('provider', 'admin'), verificationController.getSelectedCategories);

verificationRouter.get('/verification-status', authenticate, requireRoles('provider', 'admin'), verificationController.getVerificationStatus);

verificationRouter.get('/verification-records', authenticate, requireRoles('provider', 'admin'), verificationController.listMyRecords);
verificationRouter.get('/verification-records/:recordId', authenticate, requireRoles('provider', 'admin'), verificationController.getRecordDetail);
verificationRouter.post('/verification-records', authenticate, requireRoles('provider', 'admin'), verificationController.submitEvidence);
verificationRouter.post('/verification-records/:recordId/resubmit', authenticate, requireRoles('provider', 'admin'), verificationController.resubmitEvidence);

verificationRouter.get('/profile', authenticate, requireRoles('provider', 'admin'), verificationController.getProfile);
verificationRouter.patch('/profile', authenticate, requireRoles('provider', 'admin'), verificationController.updateProfile);

verificationRouter.post('/resume/upload', authenticate, requireRoles('provider', 'admin'), handleResumeUpload, verificationController.uploadResume);
verificationRouter.get('/resume/parse-result/:resultId', authenticate, requireRoles('provider', 'admin'), verificationController.getResumeParseResult);

verificationRouter.post('/oauth/github/connect', authenticate, requireRoles('provider', 'admin'), verificationController.connectGithub);
verificationRouter.get('/oauth/accounts', authenticate, requireRoles('provider', 'admin'), verificationController.getConnectedAccounts);

verificationRouter.post('/verification-records/auto-verify', authenticate, requireRoles('provider', 'admin'), verificationController.submitEvidenceWithAutoVerify);
verificationRouter.post('/verification-records/submit-batch', authenticate, requireRoles('provider', 'admin'), verificationController.submitBatchEvidence);

verificationRouter.get('/admin/records', authenticate, requireRoles('admin'), verificationController.listForAdmin);
verificationRouter.get('/admin/records/:recordId', authenticate, requireRoles('admin'), verificationController.getAdminRecordDetail);
verificationRouter.get('/admin/records/:recordId/audit-trail', authenticate, requireRoles('admin'), verificationController.getAuditTrail);
verificationRouter.post('/admin/records/:recordId/review', authenticate, requireRoles('admin'), verificationController.adminReview);

export default verificationRouter;

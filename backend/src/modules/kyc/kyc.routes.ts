import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/authorization.middleware.js';
import { kycController } from './kyc.controller.js';

const kycRouter = Router();

kycRouter.get('/provider/status', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.getProviderStatus);
kycRouter.get(
  '/provider/restricted-access',
  authenticate,
  requireRoles('pending', 'provider', 'admin'),
  kycController.getRestrictedAccess,
);
kycRouter.post('/provider/upload-image', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.uploadImage);
kycRouter.post('/provider/submit', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.submitKyc);
kycRouter.post('/provider/resubmit', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.resubmitKyc);

kycRouter.get('/admin/submissions', authenticate, requireRoles('admin'), kycController.listSubmissions);
kycRouter.get('/admin/submissions/:userId', authenticate, requireRoles('admin'), kycController.getSubmissionDetail);
kycRouter.patch('/admin/:userId/approve', authenticate, requireRoles('admin'), kycController.approveSubmission);
kycRouter.patch('/admin/:userId/reject', authenticate, requireRoles('admin'), kycController.rejectSubmission);

export default kycRouter;

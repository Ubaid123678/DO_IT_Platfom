import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin, requireRoles } from '../../middleware/authorization.middleware.js';
import { handleMulter } from '../../common/utils/upload.js';
import { kycController } from './kyc.controller.js';

const kycRouter = Router();

kycRouter.get('/provider/status', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.getProviderStatus);
kycRouter.get(
  '/provider/restricted-access',
  authenticate,
  requireRoles('pending', 'provider', 'admin'),
  kycController.getRestrictedAccess,
);
kycRouter.post(
  '/provider/upload-image',
  authenticate,
  requireRoles('pending', 'provider', 'admin'),
  handleMulter,
  kycController.uploadImage,
);
kycRouter.delete('/provider/images/:imageId', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.deleteImage);
kycRouter.post('/provider/submit', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.submitKyc);
kycRouter.post('/provider/resubmit', authenticate, requireRoles('pending', 'provider', 'admin'), kycController.resubmitKyc);

kycRouter.use('/admin', authenticate, requireAdmin);
kycRouter.get('/admin/submissions', kycController.listSubmissions);
kycRouter.get('/admin/submissions/:userId', kycController.getSubmissionDetail);
kycRouter.patch('/admin/:userId/approve', kycController.approveSubmission);
kycRouter.patch('/admin/:userId/reject', kycController.rejectSubmission);

export default kycRouter;

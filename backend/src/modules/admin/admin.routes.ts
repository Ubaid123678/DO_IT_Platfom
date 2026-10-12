import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/authorization.middleware.js';
import { adminController } from './admin.controller.js';

const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);
adminRouter.get('/dashboard/stats', adminController.getDashboardStats);
adminRouter.get('/users', adminController.listUsers);
adminRouter.get('/users/:userId', adminController.getUserDetail);
adminRouter.patch('/users/:userId', adminController.updateUser);
adminRouter.delete('/users/:userId', adminController.deleteUser);

export default adminRouter;

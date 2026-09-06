import { Router } from 'express';
import { jobController } from './job.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Client routes
router.post('/', jobController.createJob);
router.get('/client', jobController.getClientJobs);
router.get('/client/stats', jobController.getJobStats);

// Provider routes
router.get('/provider', jobController.getProviderJobs);
router.get('/provider/stats', jobController.getJobStats);

// Public browse (authenticated users)
router.get('/browse', jobController.browseJobs);
router.get('/search', jobController.searchJobs);

// Job detail and management
router.get('/:jobId', jobController.getJobById);
router.patch('/:jobId', jobController.updateJob);
router.delete('/:jobId', jobController.deleteJob);

// Status transitions
router.post('/:jobId/status', jobController.transitionStatus);

// Provider assignment (client or admin)
router.post('/:jobId/assign-provider', jobController.assignProvider);

export default router;
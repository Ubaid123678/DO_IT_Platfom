import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Review endpoints
router.post('/', reviewController.createReview);
router.get('/', reviewController.getReviews);
router.get('/job/:jobId', reviewController.getReviewsByJob);
router.get('/user', reviewController.getReviewsByUser);
router.get('/stats/:revieweeId', reviewController.getReviewStats);
router.get('/distribution/:revieweeId', reviewController.getRatingDistribution);
router.get('/:reviewId', reviewController.getReviewById);
router.patch('/:reviewId', reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);
router.post('/:reviewId/flag', reviewController.flagReview);
router.post('/:reviewId/moderate', reviewController.moderateReview);
router.post('/:reviewId/helpful', reviewController.markHelpful);

export default router;
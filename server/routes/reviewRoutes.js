import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  createReview,
  getGigReviews,
  getFreelancerReviews,
  getClientReviews,
  markReviewHelpful,
  deleteReview
} from '../controllers/reviewController.js';

const router = express.Router();

// Create a new review (protected)
router.post('/', authenticateJWT, createReview);

// Get reviews for a specific gig (public)
router.get('/gig/:gigId', getGigReviews);

// Get reviews for a freelancer (public)
router.get('/freelancer/:freelancerId', getFreelancerReviews);

// Get reviews by a client (protected)
router.get('/client/:clientId', authenticateJWT, getClientReviews);

// Mark review as helpful (public)
router.put('/:reviewId/helpful', markReviewHelpful);

// Delete a review (protected)
router.delete('/:reviewId', authenticateJWT, deleteReview);

export default router; 
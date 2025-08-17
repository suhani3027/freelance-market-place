import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  createReview,
  getGigReviews,
  getProfileReviews,
  getUserReviews,
  markReviewHelpful,
  deleteReview,
  getReviewStats
} from '../controllers/reviewController.js';

const router = express.Router();

// Create a new review (protected)
router.post('/', authenticateJWT, createReview);

// Get reviews for a specific gig (public)
router.get('/gig/:gigId', getGigReviews);

// Get reviews for a profile (public)
router.get('/profile/:profileId', getProfileReviews);

// Get reviews by a user (protected)
router.get('/user/:userId', authenticateJWT, getUserReviews);

// Get review statistics for a user (public)
router.get('/stats/:userId', getReviewStats);

// Mark review as helpful (protected)
router.put('/:reviewId/helpful', authenticateJWT, markReviewHelpful);

// Delete a review (protected)
router.delete('/:reviewId', authenticateJWT, deleteReview);

export default router; 
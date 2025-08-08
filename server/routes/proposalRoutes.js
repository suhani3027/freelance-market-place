import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  submitProposal,
  getGigProposals,
  getGigProposalsPublic,
  getFreelancerProposals,
  getClientProposals,
  updateProposalStatus,
  markProposalCompleted,
  getProposalStats
} from '../controllers/proposalController.js';

const router = express.Router();

// Create a new proposal
router.post('/', authenticateJWT, submitProposal);

// Get proposals for a specific gig (protected)
router.get('/gig/:gigId', authenticateJWT, getGigProposals);

// Get proposals for a specific gig (public - for debugging) - ALL USERS CAN VIEW
router.get('/gig/:gigId/public', getGigProposalsPublic);

// Get proposals by a freelancer
router.get('/freelancer', authenticateJWT, getFreelancerProposals);

// Get proposals for a client
router.get('/client', authenticateJWT, getClientProposals);

// Update proposal status (accept/reject)
router.put('/:proposalId/status', authenticateJWT, updateProposalStatus);

// Mark proposal as completed
router.put('/:proposalId/complete', authenticateJWT, markProposalCompleted);

// Get proposal statistics
router.get('/stats/overview', authenticateJWT, getProposalStats);

export default router; 
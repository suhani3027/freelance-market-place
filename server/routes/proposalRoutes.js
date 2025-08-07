import express from 'express';
import { 
  submitProposal, 
  getGigProposals, 
  getGigProposalsPublic,
  getFreelancerProposals, 
  updateProposalStatus, 
  getProposalDetails,
  markProposalCompleted,
  getProposalStats
} from '../controllers/proposalController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Proposal routes
router.post('/', authenticateJWT, submitProposal);
router.get('/gig/:gigId', authenticateJWT, getGigProposals);
router.get('/gig/:gigId/public', getGigProposalsPublic); // Public route for debugging
router.get('/freelancer', authenticateJWT, getFreelancerProposals);
router.put('/:proposalId/status', authenticateJWT, updateProposalStatus);
router.get('/:proposalId', authenticateJWT, getProposalDetails);
router.put('/:proposalId/complete', authenticateJWT, markProposalCompleted);
router.get('/stats/overview', authenticateJWT, getProposalStats);

export default router; 
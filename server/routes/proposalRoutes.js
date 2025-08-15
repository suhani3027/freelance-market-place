import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  submitProposal,
  getGigProposals,
  getGigProposalsPublic,
  getFreelancerProposals,
  getClientProposals,
  getFreelancerAcceptedProposals,
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

// Get accepted proposals for a freelancer (ongoing gigs)
router.get('/freelancer/accepted', authenticateJWT, getFreelancerAcceptedProposals);

// Get proposals for a client
router.get('/client', authenticateJWT, getClientProposals);

// Update proposal status (accept/reject)
router.put('/:proposalId/status', authenticateJWT, updateProposalStatus);

// Mark proposal as completed
router.put('/:proposalId/complete', authenticateJWT, markProposalCompleted);

// Get proposal statistics
router.get('/stats/overview', authenticateJWT, getProposalStats);

// Get proposal statistics by role and email
router.get('/stats/:role/:email', authenticateJWT, async (req, res) => {
  try {
    const { role, email } = req.params;
    
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Verify the user is requesting their own stats
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Not authorized to view these stats' });
    }

    const Proposal = (await import('../models/proposal.js')).Proposal;
    
    let matchQuery = {};
    if (role === 'freelancer') {
      matchQuery = { freelancerId: email };
    } else if (role === 'client') {
      matchQuery = { clientId: email };
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const stats = await Proposal.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize all statuses with 0
    const result = {
      pending: 0,
      accepted: 0,
      completed: 0,
      rejected: 0,
      paid: 0
    };

    // Fill in actual counts
    stats.forEach(stat => {
      if (result.hasOwnProperty(stat._id)) {
        result[stat._id] = stat.count;
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching proposal stats:', error);
    res.status(500).json({ message: 'Failed to fetch proposal stats' });
  }
});

export default router; 
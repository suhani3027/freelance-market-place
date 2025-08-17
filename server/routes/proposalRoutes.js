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

// Accept proposal (specific endpoint for frontend)
router.put('/:proposalId/accept', authenticateJWT, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { Proposal } = await import('../models/proposal.js');
    const { Gig } = await import('../models/gig.js');
    const { Order } = await import('../models/order.js');
    
    // Find the proposal
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // Check if user is the client who posted the gig
    if (req.user.email !== proposal.clientId) {
      return res.status(403).json({ error: 'Only the gig owner can accept proposals' });
    }
    
    // Check if proposal is already accepted
    if (proposal.status === 'accepted') {
      return res.status(400).json({ error: 'Proposal is already accepted' });
    }
    
    // Update proposal status to accepted
    proposal.status = 'accepted';
    proposal.acceptedAt = new Date();
    await proposal.save();
    
    // Create an order for the accepted proposal
    const gig = await Gig.findById(proposal.gigId);
    if (gig) {
      const order = new Order({
        gigId: proposal.gigId,
        clientId: proposal.clientId,
        freelancerId: proposal.freelancerId,
        amount: proposal.bidAmount,
        status: 'pending',
        gigTitle: gig.title,
        clientEmail: proposal.clientId,
        freelancerEmail: proposal.freelancerId,
        description: proposal.proposal
      });
      await order.save();
    }
    
    // Send notification to freelancer (if notification service is available)
    try {
      const { notifyProposalAccepted } = await import('../services/notificationService.js');
      await notifyProposalAccepted(proposal.freelancerId, proposal.clientId, proposal.gigId, gig?.title || 'Your gig', req.user.name || req.user.email);
    } catch (notifError) {
      console.log('Notification service not available:', notifError.message);
    }
    
    res.json({ 
      message: 'Proposal accepted successfully',
      proposal: proposal,
      orderCreated: !!gig
    });
    
  } catch (error) {
    console.error('Accept proposal error:', error);
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// Reject proposal (specific endpoint for frontend)
router.put('/:proposalId/reject', authenticateJWT, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { Proposal } = await import('../models/proposal.js');
    
    // Find the proposal
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // Check if user is the client who posted the gig
    if (req.user.email !== proposal.clientId) {
      return res.status(403).json({ error: 'Only the gig owner can reject proposals' });
    }
    
    // Check if proposal is already rejected
    if (proposal.status === 'rejected') {
      return res.status(400).json({ error: 'Proposal is already rejected' });
    }
    
    // Update proposal status to rejected
    proposal.status = 'rejected';
    proposal.rejectedAt = new Date();
    await proposal.save();
    
    // Send notification to freelancer (if notification service is available)
    try {
      const { notifyProposalRejected } = await import('../services/notificationService.js');
      await notifyProposalRejected(proposal.freelancerId, proposal.clientId, proposal.gigId, 'Your gig', req.user.name || req.user.email);
    } catch (notifError) {
      console.log('Notification service not available:', notifError.message);
    }
    
    res.json({ 
      message: 'Proposal rejected successfully',
      proposal: proposal
    });
    
  } catch (error) {
    console.error('Reject proposal error:', error);
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

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
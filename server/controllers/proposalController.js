import { Proposal } from '../models/proposal.js';
import { Gig } from '../models/gig.js';
import { FreelancerProfile } from '../models/freelancerProfile.js';
import { User } from '../models/user.js';

// Submit a proposal - FREELANCER ONLY
export const submitProposal = async (req, res) => {
  try {
    const { gigId, proposal, bidAmount, estimatedDuration } = req.body;
    const freelancerId = req.user.email;

    // Check if user is a freelancer
    const user = await User.findOne({ email: freelancerId });
    if (!user || user.role !== 'freelancer') {
      return res.status(403).json({ error: 'Only freelancers can submit proposals' });
    }

    // Check if gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Check if user is trying to propose on their own gig
    if (gig.clientId === freelancerId) {
      return res.status(400).json({ error: 'You cannot propose on your own gig' });
    }

    // Check if proposal already exists
    const existingProposal = await Proposal.findOne({ gigId, freelancerId });
    if (existingProposal) {
      return res.status(400).json({ error: 'You have already submitted a proposal for this gig' });
    }

    // Get freelancer profile
    const freelancerProfile = await FreelancerProfile.findOne({ email: freelancerId });
    if (!freelancerProfile) {
      return res.status(400).json({ error: 'Please complete your freelancer profile before submitting proposals' });
    }

    // Create proposal
    const newProposal = new Proposal({
      gigId,
      freelancerId,
      clientId: gig.clientId,
      proposal,
      bidAmount,
      estimatedDuration,
      freelancerProfile: {
        name: freelancerProfile.fullName || freelancerProfile.name,
        title: freelancerProfile.title,
        overview: freelancerProfile.overview,
        skills: freelancerProfile.skills,
        hourlyRate: freelancerProfile.hourlyRate,
        experienceLevel: freelancerProfile.experienceLevel,
        location: freelancerProfile.location,
        profilePhoto: freelancerProfile.profilePhoto
      }
    });

    await newProposal.save();

    res.status(201).json({
      message: 'Proposal submitted successfully',
      proposal: newProposal
    });

  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
};

// Get proposals for a gig (for client) - CLIENT ONLY
export const getGigProposals = async (req, res) => {
  try {
    const { gigId } = req.params;
    const clientId = req.user.email;

    // Check if user is a client
    const user = await User.findOne({ email: clientId });
    if (!user || user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can view gig proposals' });
    }

    // Verify gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Only allow gig owner to see proposals
    if (gig.clientId !== clientId) {
      return res.status(403).json({ error: 'Not authorized to view proposals for this gig' });
    }

    const proposals = await Proposal.find({ gigId })
      .sort({ submittedAt: -1 });

    res.json(proposals);

  } catch (error) {
    console.error('Get gig proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Get proposals for a gig (public) - ALL USERS CAN VIEW
export const getGigProposalsPublic = async (req, res) => {
  try {
    const { gigId } = req.params;

    // Verify gig exists
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    const proposals = await Proposal.find({ gigId })
      .sort({ submittedAt: -1 });

    res.json(proposals);

  } catch (error) {
    console.error('Get gig proposals public error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Get proposals by freelancer - FREELANCER ONLY
export const getFreelancerProposals = async (req, res) => {
  try {
    const freelancerId = req.user.email;

    // Check if user is a freelancer
    const user = await User.findOne({ email: freelancerId });
    if (!user || user.role !== 'freelancer') {
      return res.status(403).json({ error: 'Only freelancers can view their proposals' });
    }

    const proposals = await Proposal.find({ freelancerId })
      .populate('gigId')
      .sort({ submittedAt: -1 });

    res.json(proposals);

  } catch (error) {
    console.error('Get freelancer proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Update proposal status (accept/reject) - CLIENT ONLY
export const updateProposalStatus = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status, feedback } = req.body;
    const clientId = req.user.email;

    // Check if user is a client
    const user = await User.findOne({ email: clientId });
    if (!user || user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can accept/reject proposals' });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Verify client owns the gig
    if (proposal.clientId !== clientId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update status
    proposal.status = status;
    proposal.reviewedAt = new Date();

    if (status === 'accepted') {
      proposal.acceptedAt = new Date();
    }

    if (feedback) {
      proposal.clientFeedback = feedback;
    }

    await proposal.save();

    res.json({
      message: `Proposal ${status}`,
      proposal
    });

  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ error: 'Failed to update proposal status' });
  }
};

// Get proposal details - AUTHORIZED USERS ONLY
export const getProposalDetails = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.user.email;

    const proposal = await Proposal.findById(proposalId)
      .populate('gigId');

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if user is authorized to view this proposal
    if (proposal.freelancerId !== userId && proposal.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(proposal);

  } catch (error) {
    console.error('Get proposal details error:', error);
    res.status(500).json({ error: 'Failed to fetch proposal details' });
  }
};

// Mark proposal as completed and trigger payment
export const markProposalCompleted = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const freelancerId = req.user.email;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if the freelancer owns this proposal
    if (proposal.freelancerId !== freelancerId) {
      return res.status(403).json({ error: 'Not authorized to complete this proposal' });
    }

    // Check if proposal is accepted
    if (proposal.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted proposals can be marked as completed' });
    }

    // Update proposal status
    proposal.status = 'completed';
    proposal.completedAt = new Date();
    await proposal.save();

    // Create order for payment
    const Order = (await import('../models/order.js')).Order;
    const order = new Order({
      gigId: proposal.gigId.toString(),
      clientId: proposal.clientId,
      freelancerId: proposal.freelancerId,
      amount: proposal.bidAmount,
      status: 'pending',
      gigTitle: proposal.freelancerProfile?.title || 'Completed Project',
      clientEmail: proposal.clientId,
      freelancerEmail: proposal.freelancerId,
      description: `Payment for completed project: ${proposal.proposal.substring(0, 100)}...`
    });

    await order.save();

    res.json({ 
      success: true, 
      message: 'Proposal marked as completed. Client can now make payment.',
      orderId: order._id,
      amount: proposal.bidAmount
    });

  } catch (error) {
    console.error('Mark proposal completed error:', error);
    res.status(500).json({ error: 'Failed to mark proposal as completed' });
  }
};

// Get proposal statistics - AUTHORIZED USERS ONLY
export const getProposalStats = async (req, res) => {
  try {
    const userId = req.user.email;

    const stats = await Proposal.aggregate([
      {
        $match: {
          $or: [
            { freelancerId: userId },
            { clientId: userId }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });

    res.json(formattedStats);

  } catch (error) {
    console.error('Get proposal stats error:', error);
    res.status(500).json({ error: 'Failed to fetch proposal statistics' });
  }
}; 

// Get proposals for a client
export const getClientProposals = async (req, res) => {
  try {
    const clientId = req.user.email;
    
    const proposals = await Proposal.find({ clientId })
      .populate('gigId', 'title description amount')
      .sort({ submittedAt: -1 });

    // Add order information for completed proposals
    const Order = (await import('../models/order.js')).Order;
    const proposalsWithOrders = await Promise.all(
      proposals.map(async (proposal) => {
        const proposalObj = proposal.toObject();
        if (proposal.status === 'completed') {
          const order = await Order.findOne({
            gigId: proposal.gigId._id.toString(),
            clientId: proposal.clientId,
            freelancerId: proposal.freelancerId,
            status: 'pending'
          });
          if (order) {
            proposalObj.orderId = order._id;
          }
        }
        return proposalObj;
      })
    );

    res.json(proposalsWithOrders);
  } catch (error) {
    console.error('Get client proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch client proposals' });
  }
}; 
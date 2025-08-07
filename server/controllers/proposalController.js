import { Proposal } from '../models/proposal.js';
import { Gig } from '../models/gig.js';
import { FreelancerProfile } from '../models/freelancerProfile.js';
import { User } from '../models/user.js';

// Submit a proposal
export const submitProposal = async (req, res) => {
  try {
    const { gigId, proposal, bidAmount, estimatedDuration } = req.body;
    const freelancerId = req.user.email;

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

// Get proposals for a gig (for client)
export const getGigProposals = async (req, res) => {
  try {
    const { gigId } = req.params;
    const clientId = req.user.email;

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

// Get proposals for a gig (public - for debugging)
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

// Get proposals by freelancer
export const getFreelancerProposals = async (req, res) => {
  try {
    const freelancerId = req.user.email;

    const proposals = await Proposal.find({ freelancerId })
      .populate('gigId')
      .sort({ submittedAt: -1 });

    res.json(proposals);

  } catch (error) {
    console.error('Get freelancer proposals error:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
};

// Update proposal status (accept/reject)
export const updateProposalStatus = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { status, feedback } = req.body;
    const clientId = req.user.email;

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

// Get proposal details
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

// Mark proposal as completed
export const markProposalCompleted = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { feedback } = req.body;
    const userId = req.user.email;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Only client can mark as completed
    if (proposal.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (proposal.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted proposals can be marked as completed' });
    }

    proposal.status = 'completed';
    proposal.completedAt = new Date();
    if (feedback) {
      proposal.clientFeedback = feedback;
    }

    await proposal.save();

    res.json({
      message: 'Proposal marked as completed',
      proposal
    });

  } catch (error) {
    console.error('Mark proposal completed error:', error);
    res.status(500).json({ error: 'Failed to mark proposal as completed' });
  }
};

// Get proposal statistics
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
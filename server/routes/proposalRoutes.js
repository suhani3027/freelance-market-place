import express from 'express';
import { Proposal } from '../models/proposal.js';

const router = express.Router();

// Submit a proposal
router.post('/', async (req, res) => {
  try {
    const { gigId, freelancerId, coverLetter, amount } = req.body;
    const proposal = new Proposal({ gigId, freelancerId, coverLetter, amount });
    await proposal.save();
    res.status(201).json(proposal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get proposals for a gig (client view)
router.get('/gig/:gigId', async (req, res) => {
  try {
    const proposals = await Proposal.find({ gigId: req.params.gigId });
    res.status(200).json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get proposals for a freelancer (freelancer view)
router.get('/freelancer/:freelancerId', async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancerId: req.params.freelancerId });
    res.status(200).json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update proposal status (accept/reject)
router.patch('/:proposalId', async (req, res) => {
  try {
    const { status } = req.body;
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.proposalId,
      { status },
      { new: true }
    );
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    res.status(200).json(proposal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 
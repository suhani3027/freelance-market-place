import express from 'express';
import { FreelancerProfile } from '../models/freelancerProfile.js';

const router = express.Router();

// Create or update freelancer profile
router.post('/', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true }
    );
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get freelancer profile by userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await FreelancerProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 
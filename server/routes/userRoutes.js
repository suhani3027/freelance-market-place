import express from 'express';
import { User } from '../models/user.js';
import { FreelancerProfile } from '../models/freelancerProfile.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user edit data (for profile editing) - MUST BE BEFORE /:email route
router.get('/edit', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get freelancer profile if it exists
    let freelancerProfile = null;
    if (user.role === 'freelancer') {
      freelancerProfile = await FreelancerProfile.findOne({ email: userEmail });
    }

    // Return user data for editing
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePhoto: user.profilePhoto,
      companyName: user.companyName,
      companySize: user.companySize,
      website: user.website,
      businessDescription: user.businessDescription,
      createdAt: user.createdAt,
      ...(freelancerProfile && {
        freelancerProfile: {
          title: freelancerProfile.title,
          overview: freelancerProfile.overview,
          skills: freelancerProfile.skills,
          hourlyRate: freelancerProfile.hourlyRate,
          experienceLevel: freelancerProfile.experienceLevel,
          location: freelancerProfile.location,
          phone: freelancerProfile.phone,
          country: freelancerProfile.country,
          education: freelancerProfile.education,
          certifications: freelancerProfile.certifications,
          portfolio: freelancerProfile.portfolio,
          linkedin: freelancerProfile.linkedin,
          github: freelancerProfile.github,
          languages: freelancerProfile.languages
        }
      })
    };

    res.json(userData);
  } catch (error) {
    console.error('Get user edit error:', error);
    res.status(500).json({ error: 'Failed to fetch user data for editing' });
  }
});

// Get user by email (authenticated)
router.get('/:email', authenticateJWT, async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);

    // Check if user is requesting their own data or if it's a public request
    if (req.user.email !== decodedEmail) {
      return res.status(403).json({ error: 'Not authorized to view this user data' });
    }

    const user = await User.findOne({ email: decodedEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get freelancer profile if it exists
    let freelancerProfile = null;
    if (user.role === 'freelancer') {
      freelancerProfile = await FreelancerProfile.findOne({ email: decodedEmail });
    }

    // Return user data with profile
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
      ...(freelancerProfile && {
        freelancerProfile: {
          title: freelancerProfile.title,
          overview: freelancerProfile.overview,
          skills: freelancerProfile.skills,
          hourlyRate: freelancerProfile.hourlyRate,
          experienceLevel: freelancerProfile.experienceLevel,
          location: freelancerProfile.location
        }
      })
    };

    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;

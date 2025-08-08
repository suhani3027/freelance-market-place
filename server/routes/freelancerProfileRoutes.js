import express from 'express';
import { FreelancerProfile } from '../models/freelancerProfile.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create or update freelancer profile
router.post('/', async (req, res) => {
  try {
    const { userId, email, ...profileData } = req.body;
    
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!email) return res.status(400).json({ message: 'email is required' });
    
    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId },
      { $set: { ...profileData, email } },
      { new: true, upsert: true }
    );
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's freelancer profile (for authenticated users)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // First try to find a freelancer profile
    let profile = await FreelancerProfile.findOne({ email: userEmail });
    
    if (!profile) {
      // If no freelancer profile found, check if user exists and create a basic profile
      const User = (await import('../models/user.js')).User;
      const user = await User.findOne({ email: userEmail });
      
      if (user) {
        // Create a basic profile from user data with better mapping
        profile = {
          userId: user._id.toString(),
          email: user.email,
          fullName: user.name,
          name: user.name, // Add this for compatibility
          title: user.role === 'freelancer' ? 'Freelancer' : (user.companyName ? 'Client' : 'Freelancer'),
          overview: user.businessDescription || 'No overview available',
          skills: [],
          categories: [],
          hourlyRate: 0,
          availability: 'Available',
          experienceLevel: 'Beginner',
          education: [],
          employment: [],
          certifications: [],
          portfolio: [],
          languages: [],
          socialLinks: [],
          role: user.role,
          companyName: user.companyName,
          companySize: user.companySize,
          website: user.website,
          businessDescription: user.businessDescription
        };
        
        // Save this basic profile to the database for future use
        const newProfile = new FreelancerProfile(profile);
        await newProfile.save();
        profile = newProfile.toObject();
      } else {
        return res.status(404).json({ message: 'Profile not found' });
      }
    }
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update freelancer profile by email
router.put('/:email', authenticateJWT, async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    const updateData = req.body;
    
    // Check if user is updating their own profile
    if (req.user.email !== decodedEmail) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }
    
    const profile = await FreelancerProfile.findOneAndUpdate(
      { email: decodedEmail },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get freelancer profile by email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    // First try to find a freelancer profile
    let profile = await FreelancerProfile.findOne({ email: decodedEmail });
    
    if (!profile) {
      // If no freelancer profile found, check if user exists and create a basic profile
      const User = (await import('../models/user.js')).User;
      const user = await User.findOne({ email: decodedEmail });
      
      if (user) {
        // Create a basic profile from user data with better mapping
        profile = {
          userId: user._id.toString(),
          email: user.email,
          fullName: user.name,
          name: user.name, // Add this for compatibility
          title: user.role === 'freelancer' ? 'Freelancer' : (user.companyName ? 'Client' : 'Freelancer'),
          overview: user.businessDescription || 'No overview available',
          skills: [],
          categories: [],
          hourlyRate: 0,
          availability: 'Available',
          experienceLevel: 'Beginner',
          education: [],
          employment: [],
          certifications: [],
          portfolio: [],
          languages: [],
          socialLinks: [],
          role: user.role,
          companyName: user.companyName,
          companySize: user.companySize,
          website: user.website,
          businessDescription: user.businessDescription
        };
        
        // Save this basic profile to the database for future use
        const newProfile = new FreelancerProfile(profile);
        await newProfile.save();
        profile = newProfile.toObject();
      } else {
        return res.status(404).json({ message: 'Profile not found' });
      }
    }
    
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router; 
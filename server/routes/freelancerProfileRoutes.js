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
    
    // Clean profileData to remove any undefined or null values
    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    // Use findOneAndUpdate with upsert to handle existing profiles gracefully
    const profile = await FreelancerProfile.findOneAndUpdate(
      { email },
      { 
        $set: cleanProfileData,
        $setOnInsert: { email, userId }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    res.status(200).json(profile);
  } catch (error) {
    console.error('Profile creation/update error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(400).json({ 
          message: 'A profile with this email already exists. Please use a different email or update your existing profile.' 
        });
      }
      if (error.keyPattern.userId) {
        return res.status(500).json({ 
          message: 'A profile for this user already exists. Please update your existing profile.' 
        });
      }
    }
    
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
    
    // Remove userId from updateData if it exists to prevent conflicts
    const { userId, ...cleanUpdateData } = updateData;
    
    // Transform the data to match the model schema
    const transformedData = {
      ...cleanUpdateData,
      // Handle education field - if it's a string, convert to array format
      education: cleanUpdateData.education ? 
        (typeof cleanUpdateData.education === 'string' ? 
          [{ school: 'Education', degree: cleanUpdateData.education, field: '', startYear: '', endYear: '' }] : 
          cleanUpdateData.education) : [],
      
      // Handle certifications field - if it's a string, convert to array format
      certifications: cleanUpdateData.certifications ? 
        (typeof cleanUpdateData.certifications === 'string' ? 
          [{ name: cleanUpdateData.certifications, issuer: '', year: '' }] : 
          cleanUpdateData.certifications) : [],
      
      // Handle portfolio field - if it's a string URL, convert to array format
      portfolio: cleanUpdateData.portfolio ? 
        (typeof cleanUpdateData.portfolio === 'string' ? 
          [{ title: 'Portfolio', description: '', url: cleanUpdateData.portfolio, image: '' }] : 
          cleanUpdateData.portfolio) : [],
      
      // Handle social links - combine LinkedIn and GitHub into socialLinks array
      socialLinks: [
        ...(cleanUpdateData.linkedin ? [{ platform: 'LinkedIn', url: cleanUpdateData.linkedin }] : []),
        ...(cleanUpdateData.github ? [{ platform: 'GitHub', url: cleanUpdateData.github }] : []),
        ...(cleanUpdateData.socialLinks || [])
      ],
      
      // Handle languages field - if it's an array of strings, convert to object format
      languages: cleanUpdateData.languages ? 
        (Array.isArray(cleanUpdateData.languages) && typeof cleanUpdateData.languages[0] === 'string' ? 
          cleanUpdateData.languages.map(lang => ({ name: lang, proficiency: 'Fluent' })) : 
          cleanUpdateData.languages) : [],
      
      // Ensure skills is an array and not empty
      skills: Array.isArray(cleanUpdateData.skills) && cleanUpdateData.skills.length > 0 ? 
        cleanUpdateData.skills : ['General'],
      
      // Convert hourlyRate to number if it's a string
      hourlyRate: cleanUpdateData.hourlyRate ? Number(cleanUpdateData.hourlyRate) : 0,
      
      // Ensure overview has minimum length or provide default
      overview: cleanUpdateData.overview && cleanUpdateData.overview.trim().length > 0 ? 
        cleanUpdateData.overview : 'No overview provided'
    };
    
    // Remove the individual fields that we've transformed
    delete transformedData.linkedin;
    delete transformedData.github;
    
    console.log('Updating profile for:', decodedEmail);
    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    
    const profile = await FreelancerProfile.findOneAndUpdate(
      { email: decodedEmail },
      { $set: transformedData },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({
      ...profile.toObject(),
      message: 'Profile updated successfully!'
    });
  } catch (err) {
    console.error('Profile update error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        details: validationErrors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update profile', 
      details: err.message,
      timestamp: new Date().toISOString()
    });
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
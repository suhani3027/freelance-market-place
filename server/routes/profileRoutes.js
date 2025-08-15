import express from 'express';
import { User } from '../models/user.js';
import { FreelancerProfile } from '../models/freelancerProfile.js';
import { Gig } from '../models/gig.js';
import { Review } from '../models/review.js';

const router = express.Router();

// Get user profile by email (public)
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);

    // First check if there's a freelancer profile
    let profile = await FreelancerProfile.findOne({ email: decodedEmail });
    
    if (profile) {
      // Get user's gigs
      const gigs = await Gig.find({ clientId: decodedEmail, status: 'active' })
        .select('title description skills amount duration image createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      // Get profile reviews
      const reviews = await Review.find({ 
        targetId: decodedEmail, 
        reviewType: 'profile',
        status: 'active'
      })
        .select('rating comment title reviewerName createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      // Calculate average rating
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      return res.status(200).json({
        type: 'freelancer_profile',
        profile: {
          id: profile._id,
          email: profile.email,
          fullName: profile.fullName || profile.name,
          title: profile.title,
          overview: profile.overview,
          skills: profile.skills,
          categories: profile.categories,
          hourlyRate: profile.hourlyRate,
          availability: profile.availability,
          experienceLevel: profile.experienceLevel,
          education: profile.education,
          employment: profile.employment,
          certifications: profile.certifications,
          portfolio: profile.portfolio,
          location: profile.location,
          englishLevel: profile.englishLevel,
          companyName: profile.companyName,
          companySize: profile.companySize,
          website: profile.website,
          businessDescription: profile.businessDescription,
          profilePhoto: profile.profilePhoto,
          role: profile.role || 'freelancer'
        },
        gigs,
        reviews,
        stats: {
          totalGigs: gigs.length,
          totalReviews: reviews.length,
          averageRating: Math.round(avgRating * 10) / 10
        }
      });
    }

    // If no freelancer profile, check for basic user
    const user = await User.findOne({ email: decodedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's gigs if they're a client
    let gigs = [];
    if (user.role === 'client') {
      gigs = await Gig.find({ clientId: decodedEmail, status: 'active' })
        .select('title description skills amount duration image createdAt')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Get profile reviews
    const reviews = await Review.find({ 
      targetId: decodedEmail, 
      reviewType: 'profile',
      status: 'active'
    })
      .select('rating comment title reviewerName createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    res.status(200).json({
      type: 'basic_user',
      profile: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        companySize: user.companySize,
        website: user.website,
        businessDescription: user.businessDescription
      },
      gigs,
      reviews,
      stats: {
        totalGigs: gigs.length,
        totalReviews: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// Get gig details by ID (public)
router.get('/gig/:gigId', async (req, res) => {
  try {
    const { gigId } = req.params;
    
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Get gig reviews
    const reviews = await Review.find({ 
      gigId, 
      reviewType: 'gig',
      status: 'active'
    })
      .select('rating comment title reviewerName createdAt')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Get client info
    const client = await User.findOne({ email: gig.clientId })
      .select('name email companyName');

    res.status(200).json({
      gig: {
        ...gig.toObject(),
        client: client ? {
          name: client.name,
          email: client.email,
          companyName: client.companyName
        } : null
      },
      reviews,
      stats: {
        totalReviews: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10
      }
    });

  } catch (error) {
    console.error('Gig fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch gig', error: error.message });
  }
});

export default router;

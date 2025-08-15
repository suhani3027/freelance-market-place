import express from 'express';
import { User } from '../models/user.js';
import { Gig } from '../models/gig.js';
import { FreelancerProfile } from '../models/freelancerProfile.js';

const router = express.Router();

// Comprehensive search endpoint
router.get('/', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    // Search request received
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = new RegExp(q, 'i');
    // Initialize results object with empty arrays
    let results = {
      people: [],
      gigs: []
    };

    // Search for users/people
    if (!type || type === 'people') {
      // Search in User collection
      const users = await User.find({
        $or: [
          { name: searchQuery },
          { email: searchQuery },
          { companyName: searchQuery }
        ]
      }, { name: 1, email: 1, companyName: 1, role: 1, _id: 1 });

      // Search in FreelancerProfile collection
      const profiles = await FreelancerProfile.find({
        $or: [
          { fullName: searchQuery },
          { email: searchQuery },
          { title: searchQuery },
          { overview: searchQuery },
          { skills: { $regex: q, $options: 'i' } }
        ]
      }, { fullName: 1, email: 1, title: 1, role: 1, _id: 1, skills: 1, overview: 1 });

      // Normalize user results
      const normalizedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        title: user.role === 'freelancer' ? 'Freelancer' : 'Client',
        userType: 'registered_user',
        type: 'user'
      }));

      // Normalize profile results
      const normalizedProfiles = profiles.map(profile => ({
        id: profile._id,
        name: profile.fullName,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role || 'freelancer',
        title: profile.title,
        companyName: profile.companyName,
        skills: profile.skills,
        overview: profile.overview,
        userType: 'completed_profile',
        type: 'profile'
      }));

      // Combine and deduplicate
      const allPeople = [...normalizedUsers, ...normalizedProfiles];
      const validPeople = allPeople.filter(item => item.email && item.email.trim() !== '');
      const uniquePeople = validPeople.filter((item, index, self) => 
        index === self.findIndex(t => t.email === item.email)
      );

      results.people = uniquePeople;
    }

    // Search for gigs
    if (!type || type === 'gigs') {
      const gigs = await Gig.find({
        $or: [
          { title: searchQuery },
          { description: searchQuery },
          { skills: { $regex: q, $options: 'i' } }
        ],
        status: 'active'
      }, { title: 1, description: 1, skills: 1, amount: 1, duration: 1, clientId: 1, image: 1, createdAt: 1 });

      // Add gig type identifier
      const normalizedGigs = gigs.map(gig => ({
        ...gig.toObject(),
        type: 'gig'
      }));

      results.gigs = normalizedGigs;
    }

    const response = {
      query: q,
      type: type || 'all',
      results: {
        people: results.people || [],
        gigs: results.gigs || []
      },
      total: {
        people: results.people ? results.people.length : 0,
        gigs: results.gigs ? results.gigs.length : 0
      }
    };
    
    // Search response prepared
    res.json(response);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Search suggestions/autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchQuery = new RegExp(q, 'i');
    const suggestions = [];

    // Get user suggestions
    const users = await User.find({
      $or: [
        { name: searchQuery },
        { email: searchQuery }
      ]
    }, { name: 1, email: 1, role: 1 }).limit(5);

    users.forEach(user => {
      suggestions.push({
        type: 'user',
        id: user._id,
        text: user.name || user.email,
        email: user.email,
        role: user.role
      });
    });

    // Get gig suggestions
    const gigs = await Gig.find({
      title: searchQuery,
      status: 'active'
    }, { title: 1, skills: 1 }).limit(5);

    gigs.forEach(gig => {
      suggestions.push({
        type: 'gig',
        id: gig._id,
        text: gig.title,
        skills: gig.skills
      });
    });

    res.json({ suggestions: suggestions.slice(0, 10) });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
});

export default router;

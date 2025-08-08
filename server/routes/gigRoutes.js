import express from 'express';
import { Gig } from '../models/gig.js';
import parser from '../utils/multer.js';
import cloudinary from '../utils/cloudinary.js';
import { notifyGigCreated } from '../services/notificationService.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { User } from '../models/user.js';

const router = express.Router();

// Middleware to check if user is a client
const requireClientRole = async (req, res, next) => {
  try {
    
    
    // Check if role is missing from JWT token
    if (!req.user.role) {
      const user = await User.findOne({ email: req.user.email });
      if (user && user.role === 'client') {
        req.user.role = user.role; // Add role to req.user for consistency
        next();
        return;
      } else {
        return res.status(403).json({ 
          error: 'Only clients can perform this action',
          details: 'Please re-login to refresh your session'
        });
      }
    }
    
    const user = await User.findOne({ email: req.user.email });
    
    if (!user || user.role !== 'client') {
      return res.status(403).json({ error: 'Only clients can perform this action' });
    }
    next();
  } catch (error) {

    res.status(500).json({ error: 'Error checking user role' });
  }
};



// Create a new gig with image upload - CLIENT ONLY
router.post('/', authenticateJWT, requireClientRole, parser.single('image'), async (req, res) => {
  try {

    
    const { title, skills, duration, amount, description, clientId, clientEmail, freelancerId } = req.body;
    
    // Validate required fields
    if (!title || !skills || !duration || !amount || !description || !clientId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['title', 'skills', 'duration', 'amount', 'description', 'clientId'],
        received: { title: !!title, skills: !!skills, duration: !!duration, amount: !!amount, description: !!description, clientId: !!clientId }
      });
    }
    
    // Ensure the clientId matches the authenticated user
    if (clientId !== req.user.email) {

      return res.status(403).json({ error: 'You can only create gigs for yourself' });
    }
    
    let imageUrl = '';
    
    // Handle image upload if provided
    if (req.file) {

      
      try {
        console.log('Starting Cloudinary upload...');
        
        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;
        
        console.log('Uploading base64 image to Cloudinary...');
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'gigs',
          public_id: `gig_${Date.now()}_${req.file.originalname}`,
          resource_type: 'image'
        });
        
        imageUrl = result.secure_url;
        console.log('Final image URL:', imageUrl);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        console.log('Continuing without image upload...');
        imageUrl = '';
      }
    } else {
      console.log('No image file provided');
    }
    
    // Parse skills if it's a JSON string
    const parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    
    const gig = new Gig({ 
      title, 
      skills: parsedSkills, 
      duration, 
      amount: Number(amount), 
      description, 
      clientId, 
      clientEmail, 
      freelancerId, 
      image: imageUrl 
    });
    
    await gig.save();
    
    // Send notification for gig creation
    await notifyGigCreated(gig._id, clientId, title);
    res.status(201).json(gig);
  } catch (error) {
    console.error('Gig creation error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate gig found' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Simple gig creation without image upload for testing - CLIENT ONLY
router.post('/simple', authenticateJWT, requireClientRole, async (req, res) => {
  try {

    
    const { title, skills, duration, amount, description, clientId, clientEmail, freelancerId } = req.body;
    
    // Ensure the clientId matches the authenticated user
    if (clientId !== req.user.email) {
      return res.status(403).json({ error: 'You can only create gigs for yourself' });
    }
    
    // Parse skills if it's a JSON string
    const parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    
    const gig = new Gig({ 
      title, 
      skills: parsedSkills, 
      duration, 
      amount: Number(amount), 
      description, 
      clientId, 
      clientEmail, 
      freelancerId, 
      image: '' 
    });
    
    await gig.save();
    res.status(201).json(gig);
  } catch (error) {
    console.error('Gig creation error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ 
        error: 'Duplicate gig found' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get all gigs - ALL USERS CAN VIEW
router.get('/', async (req, res) => {
  try {
    const { clientId, search } = req.query;
    let query = {};
    
    // Filter by clientId if provided
    if (clientId) {
      query.clientId = clientId;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const gigs = await Gig.find(query).sort({ createdAt: -1 });
    
    // If clientId is provided, calculate statistics from orders
    if (clientId) {
      const { Order } = await import('../models/order.js');
      
      // Calculate statistics for each gig
      const gigsWithStats = await Promise.all(gigs.map(async (gig) => {
        // Get orders for this gig
        const orders = await Order.find({ gigId: gig._id.toString() });
        
        // Calculate statistics
        const completedOrders = orders.filter(order => order.status === 'completed');
        const totalEarned = completedOrders.reduce((sum, order) => sum + order.amount, 0);
        const totalViews = gig.views || 0; // This would need to be tracked separately
        const avgRating = gig.rating || 0; // This would need to be calculated from reviews
        
        return {
          ...gig.toObject(),
          orders: orders.length,
          earned: totalEarned,
          views: totalViews,
          rating: avgRating,
          reviewCount: gig.reviewCount || 0
        };
      }));
      
      res.status(200).json(gigsWithStats);
    } else {
      res.status(200).json(gigs);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search gigs endpoint - ALL USERS CAN SEARCH
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const query = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q, 'i')] } },
        { technology: { $regex: q, $options: 'i' } }
      ]
    };
    
    const gigs = await Gig.find(query).sort({ createdAt: -1 });
    res.status(200).json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single gig by ID - ALL USERS CAN VIEW
router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.status(200).json(gig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a gig - CLIENT ONLY (and only their own gigs)
router.put('/:id', authenticateJWT, requireClientRole, async (req, res) => {
  try {
    const { title, amount, technology, duration, description, clientId } = req.body;
    
    // First check if the gig exists and belongs to the authenticated client
    const existingGig = await Gig.findById(req.params.id);
    if (!existingGig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    if (existingGig.clientId !== req.user.email) {
      return res.status(403).json({ error: 'You can only edit your own gigs' });
    }
    
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { title, amount, technology, duration, description, clientId },
      { new: true }
    );
    
    res.status(200).json(gig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a gig - CLIENT ONLY (and only their own gigs)
router.delete('/:id', authenticateJWT, requireClientRole, async (req, res) => {
  try {
    // First check if the gig exists and belongs to the authenticated client
    const existingGig = await Gig.findById(req.params.id);
    if (!existingGig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    if (existingGig.clientId !== req.user.email) {
      return res.status(403).json({ error: 'You can only delete your own gigs' });
    }
    
    const gig = await Gig.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Gig deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Image upload endpoint (kept for backward compatibility) - CLIENT ONLY
router.post('/upload', authenticateJWT, requireClientRole, parser.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    // Upload buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });
    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});

export default router; 
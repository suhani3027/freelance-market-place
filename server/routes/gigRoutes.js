import express from 'express';
import { Gig } from '../models/gig.js';
import parser from '../utils/multer.js';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import { notifyGigCreated } from '../services/notificationService.js';

const router = express.Router();

// Create a new gig with image upload
const upload = multer({ storage: multer.memoryStorage() });
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, skills, duration, amount, description, clientId, clientEmail, freelancerId } = req.body;
    
    let imageUrl = '';
    
    // Handle image upload if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        // Continue without image if upload fails
      }
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
    res.status(400).json({ message: error.message });
  }
});

// Get all gigs with optional filtering
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
    res.status(200).json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search gigs endpoint
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

// Get a single gig by ID
router.get('/:id', async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.status(200).json(gig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a gig
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, technology, duration, description, clientId } = req.body;
    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { title, amount, technology, duration, description, clientId },
      { new: true }
    );
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.status(200).json(gig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a gig
router.delete('/:id', async (req, res) => {
  try {
    const gig = await Gig.findByIdAndDelete(req.params.id);
    if (!gig) return res.status(404).json({ message: 'Gig not found' });
    res.status(200).json({ message: 'Gig deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Image upload endpoint (kept for backward compatibility)
router.post('/upload', upload.single('image'), async (req, res) => {
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
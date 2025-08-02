import express from 'express';
import { Gig } from '../models/gig.js';
import parser from '../utils/multer.js';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();

// Create a new gig
router.post('/', async (req, res) => {
  try {
    const { title, skills, duration, amount, description, clientId, clientEmail, freelancerId, image } = req.body;
    const gig = new Gig({ title, skills, duration, amount, description, clientId, clientEmail, freelancerId, image });
    await gig.save();
    res.status(201).json(gig);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all gigs
router.get('/', async (req, res) => {
  try {
    const gigs = await Gig.find();
    res.status(200).json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Image upload endpoint
const upload = multer({ storage: multer.memoryStorage() });
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    // Upload buffer to Cloudinary
    const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) return res.status(500).json({ message: 'Cloudinary upload failed', error });
      res.json({ imageUrl: result.secure_url });
    });
    // Write the buffer to the upload stream
    result.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed', error: err.message });
  }
});
export default router; 
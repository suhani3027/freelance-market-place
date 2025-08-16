import express from 'express';
import { connectDB } from "../config/db.js";
import { User } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Register handler
router.post('/register', async (req, res) => {
  const { name, email, password, role, companyName, companySize, industry, phone, website, linkedin, businessDescription } = req.body;

  await connectDB();

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ 
    name, 
    email, 
    password: hashedPassword, 
    role: role || 'client',
    companyName, 
    companySize, 
    industry,
    phone,
    website, 
    linkedin,
    businessDescription 
  });
  await newUser.save();

  // Automatically create a basic profile for the user
  try {
    const FreelancerProfile = (await import('../models/freelancerProfile.js')).FreelancerProfile;
    
    // Use findOneAndUpdate with upsert to handle existing profiles gracefully
    const basicProfile = await FreelancerProfile.findOneAndUpdate(
      { email: newUser.email },
      {
        $setOnInsert: {
          userId: newUser._id.toString(),
          email: newUser.email,
          fullName: newUser.name,
          name: newUser.name,
          title: role === 'freelancer' ? 'Freelancer' : (companyName ? 'Client' : 'Freelancer'),
          overview: businessDescription || 'No overview available',
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
          role: role || 'client',
          companyName: companyName,
          companySize: companySize,
          industry: industry,
          phone: phone,
          website: website,
          linkedin: linkedin,
          businessDescription: businessDescription
        }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    console.log('✅ Profile handled for user:', newUser.email);
  } catch (profileError) {
    console.error('Error handling profile during registration:', profileError);
    // Don't fail registration if profile creation fails
    if (profileError.code === 11000) {
      console.log('ℹ️ Profile already exists (duplicate key), continuing with registration');
    }
  }

  return res.status(201).json({ message: "User registered" });
});

// Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  // Create access token (short-lived)
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '1h' } // 1 hour for access token
  );
  
  // Create refresh token (long-lived)
  const refreshToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role }, 
    JWT_SECRET, 
    { expiresIn: '30d' } // 30 days for refresh token
  );
  
  // Store refresh token in user document
  user.refreshToken = refreshToken;
  await user.save();

  return res.status(200).json({ 
    accessToken,
    refreshToken,
    role: user.role,
    name: user.name,
    email: user.email
  });
});

// Refresh token handler
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Find user and check if refresh token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.json({ 
      accessToken: newAccessToken,
      user: { id: user._id, name: user.name, role: user.role, email: user.email } 
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    res.status(500).json({ message: err.message });
  }
});

// Logout handler
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Find user and remove refresh token
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
    
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user info by email
router.get('/user/:email', async (req, res) => {
  const { email } = req.params;
  const decodedEmail = decodeURIComponent(email);
  await connectDB();
  
  // First check if there's a freelancer profile
  const FreelancerProfile = (await import('../models/freelancerProfile.js')).FreelancerProfile;
  let profile = await FreelancerProfile.findOne({ email: decodedEmail });
  
  if (profile) {
    // Return complete freelancer profile
    return res.status(200).json({
      name: profile.fullName || profile.name,
      email: profile.email,
      role: profile.role || 'freelancer',
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
    });
  }
  
  // If no freelancer profile, check for basic user
  const user = await User.findOne({ email: decodedEmail });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  // Return basic user data without creating a profile
  return res.status(200).json({
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.role === 'freelancer' ? 'Freelancer' : 'Client',
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
    location: '',
    englishLevel: 'Basic',
    companyName: user.companyName,
    companySize: user.companySize,
    website: user.website,
    businessDescription: user.businessDescription,
    profilePhoto: null,
  });
});

// Get all users (name and email only)
router.get('/users', async (req, res) => {
  await connectDB();
  const users = await User.find({}, { name: 1, email: 1, _id: 0 });
  res.status(200).json(users);
});



// Search users by name or email
// REMOVED: This route conflicts with the main search route
// Use /api/search instead for all search functionality
// router.get('/search', async (req, res) => { ... });

export default router;

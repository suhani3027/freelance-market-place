import { connectDB } from "../config/db.js";
import { User } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Register handler
export async function register(req, res) {
  const { name, email, password, role, companyName, companySize, website, businessDescription } = req.body;

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
    website, 
    businessDescription 
  });
  await newUser.save();

  return res.status(201).json({ message: "User registered" });
}

// Login handler
export async function login(req, res) {
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

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

  return res.status(200).json({ 
    token,
    role: user.role,
    name: user.name,
    email: user.email
  });
}

// Get user info by email
export async function getUserByEmail(req, res) {
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
  
  return res.status(200).json({
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    companySize: user.companySize,
    website: user.website,
    businessDescription: user.businessDescription,
  });
}

// Get all users (name and email only)
export async function getAllUsers(req, res) {
  await connectDB();
  const users = await User.find({}, { name: 1, email: 1, _id: 0 });
  res.status(200).json(users);
}

// Search users by name or email
export async function searchUsers(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: 'Missing search query' });
  await connectDB();
  const regex = new RegExp(q, 'i');
  
  // Search in User collection
  const users = await User.find({
    $or: [
      { name: regex },
      { email: regex },
      { companyName: regex },
    ]
  }, { name: 1, email: 1, companyName: 1, role: 1, _id: 1 });
  
  // Search in FreelancerProfile collection
  const FreelancerProfile = (await import('../models/freelancerProfile.js')).FreelancerProfile;
  const profiles = await FreelancerProfile.find({
    $or: [
      { fullName: regex },
      { email: regex },
      { title: regex },
      { overview: regex },
      { skills: { $in: [regex] } }
    ]
  }, { fullName: 1, email: 1, title: 1, role: 1, _id: 1, skills: 1, overview: 1 });
  
  console.log('Search query:', q);
  console.log('Search results - Users:', users);
  console.log('Search results - Profiles:', profiles);
  
  // Normalize the results to have consistent field names
  const normalizedUsers = users.map(user => ({
    name: user.name,
    fullName: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    title: user.role === 'freelancer' ? 'Freelancer' : 'Client',
    userType: 'registered_user'
  }));
  
  const normalizedProfiles = profiles.map(profile => ({
    name: profile.fullName,
    fullName: profile.fullName,
    email: profile.email,
    role: profile.role || 'freelancer',
    title: profile.title,
    companyName: profile.companyName,
    userType: 'completed_profile'
  }));
  
  console.log('Normalized Users:', normalizedUsers);
  console.log('Normalized Profiles:', normalizedProfiles);
  
  // Combine and deduplicate results
  const allResults = [...normalizedUsers, ...normalizedProfiles];
  
  // Filter out results without email addresses
  const validResults = allResults.filter(item => item.email && item.email.trim() !== '');
  
  const uniqueResults = validResults.filter((item, index, self) => 
    index === self.findIndex(t => t.email === item.email)
  );
  
  console.log('Final unique results:', uniqueResults);
  res.status(200).json(uniqueResults);
}

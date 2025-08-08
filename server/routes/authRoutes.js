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

  // Automatically create a basic profile for the user
  try {
    const FreelancerProfile = (await import('../models/freelancerProfile.js')).FreelancerProfile;
    const basicProfile = new FreelancerProfile({
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
      website: website,
      businessDescription: businessDescription
    });
    await basicProfile.save();
  } catch (profileError) {
    console.error('Error creating basic profile during registration:', profileError);
    // Don't fail registration if profile creation fails
  }

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

  const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

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
  
  // Create a basic profile from user data and save it
  try {
    const basicProfile = new FreelancerProfile({
      userId: user._id.toString(),
      email: user.email,
      fullName: user.name,
      name: user.name,
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
    });
    await basicProfile.save();
    
    // Return the newly created profile
    return res.status(200).json({
      name: basicProfile.fullName || basicProfile.name,
      email: basicProfile.email,
      role: basicProfile.role || 'freelancer',
      title: basicProfile.title,
      overview: basicProfile.overview,
      skills: basicProfile.skills,
      categories: basicProfile.categories,
      hourlyRate: basicProfile.hourlyRate,
      availability: basicProfile.availability,
      experienceLevel: basicProfile.experienceLevel,
      education: basicProfile.education,
      employment: basicProfile.employment,
      certifications: basicProfile.certifications,
      portfolio: basicProfile.portfolio,
      location: basicProfile.location,
      englishLevel: basicProfile.englishLevel,
      companyName: basicProfile.companyName,
      companySize: basicProfile.companySize,
      website: basicProfile.website,
      businessDescription: basicProfile.businessDescription,
      profilePhoto: basicProfile.profilePhoto,
    });
  } catch (profileError) {
    console.error('Error creating basic profile:', profileError);
    // If profile creation fails, return basic user data
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
  
  
  
  // Combine and deduplicate results
  const allResults = [...normalizedUsers, ...normalizedProfiles];
  
  // Filter out results without email addresses
  const validResults = allResults.filter(item => item.email && item.email.trim() !== '');
  
  const uniqueResults = validResults.filter((item, index, self) => 
    index === self.findIndex(t => t.email === item.email)
  );
  
  
  res.status(200).json(uniqueResults);
}

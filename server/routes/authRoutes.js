import { connectDB } from "../config/db.js";
import { User } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Register handler
export async function register(req, res) {
  const { name, email, password, companyName, companySize, website, businessDescription } = req.body;

  await connectDB();

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ name, email, password: hashedPassword, companyName, companySize, website, businessDescription });
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
  }l

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "1d" });

  return res.status(200).json({ token });
}

// Get user info by email
export async function getUserByEmail(req, res) {
  const { email } = req.params;
  await connectDB();
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.status(200).json({
    name: user.name,
    email: user.email,
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
  const users = await User.find({
    $or: [
      { name: regex },
      { email: regex },
      { companyName: regex },
    ]
  }, { name: 1, email: 1, companyName: 1, role: 1, _id: 0 });
  res.status(200).json(users);
}

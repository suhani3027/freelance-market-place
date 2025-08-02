import mongoose from "mongoose";

const freelancerProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  profilePhoto: { type: String },
  fullName: { type: String },
  location: { type: String },
  englishLevel: { type: String },
  title: { type: String },
  overview: { type: String },
  skills: { type: [String] },
  categories: { type: [String] },
  hourlyRate: { type: Number },
  availability: { type: String },
  experienceLevel: { type: String },
  education: [{ school: String, degree: String, field: String, startYear: String, endYear: String }],
  employment: [{ company: String, role: String, startYear: String, endYear: String, description: String }],
  certifications: [{ name: String, issuer: String, year: String }],
  portfolio: [{ title: String, description: String, url: String, image: String }],
  languages: [{ name: String, proficiency: String }],
  socialLinks: [{ platform: String, url: String }],
}, { timestamps: true });

const FreelancerProfile = mongoose.models.FreelancerProfile || mongoose.model("FreelancerProfile", freelancerProfileSchema);

export { FreelancerProfile }; 
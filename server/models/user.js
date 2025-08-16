import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  companyName: String,
  companySize: String,
  industry: String,
  phone: String,
  website: String,
  linkedin: String,
  businessDescription: String,
  role: { type: String, enum: ['client', 'freelancer'], default: 'client' },
  refreshToken: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export { User };

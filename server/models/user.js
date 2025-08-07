import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  companyName: String,
  companySize: String,
  website: String,
  businessDescription: String,
  role: { type: String, enum: ['client', 'freelancer'], default: 'client' },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export { User };

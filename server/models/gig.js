import mongoose from "mongoose";

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true },
  skills: { type: [String], required: true },
  duration: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String }, // Cloudinary image URL
  clientId: { type: String, required: true },
  clientEmail: { type: String, required: false }, // Store client email for Upwork style display
  freelancerId: { type: String, required: false }, // optional for now
  status: { type: String, enum: ['active', 'paused', 'draft', 'pending'], default: 'active' },
  orders: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  earned: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

const Gig = mongoose.models.Gig || mongoose.model("Gig", gigSchema);

export { Gig }; 
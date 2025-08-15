import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema({
  requesterId: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  requesterName: { type: String, required: true },
  recipientId: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Compound index to prevent duplicate connections
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema);

export { Connection }; 
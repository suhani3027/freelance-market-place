import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['connection_request', 'connection_accepted', 'connection_rejected', 'gig_proposal', 'message', 'gig_created', 'gig_updated'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // For gig/proposal/connection IDs
  relatedType: { type: String }, // 'gig', 'proposal', 'connection'
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export { Notification }; 
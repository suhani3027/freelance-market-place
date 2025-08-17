import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // Changed to String to store email
  sender: { type: String, required: true }, // Changed to String to store email
  type: { 
    type: String, 
    enum: [
      'connection_request', 
      'connection_accepted', 
      'connection_rejected', 
      'gig_proposal', 
      'new_proposal',
      'proposal_accepted',
      'proposal_rejected',
      'gig_completed',
      'payment_received',
      'order_created',
      'order_status_updated',
      'new_gig',
      'gig_updated',
      'review_received',
      'milestone_reached',
      'message', 
      'new_message',
      'gig_created', 
      'gig_updated', 
      'profile_review'
    ],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed }, // Additional data
  readAt: { type: Date }, // When notification was read
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  }, // Notification priority
  category: { 
    type: String, 
    enum: ['proposal', 'payment', 'message', 'gig', 'order', 'system'], 
    default: 'system' 
  }, // Notification category
}, { timestamps: true });

// Index for better query performance
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, category: 1 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export { Notification }; 
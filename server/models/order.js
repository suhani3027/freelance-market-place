import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  gigId: { type: String, required: true },
  clientId: { type: String, required: true },
  freelancerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'ongoing', 'paid', 'in_progress', 'completed', 'cancelled', 'pending_payment'],
    default: 'pending'
  },
  stripePaymentIntentId: { type: String },
  stripeSessionId: { type: String },
  paymentMethod: { type: String, default: 'stripe' },
  gigTitle: { type: String, required: true },
  clientEmail: { type: String, required: true },
  freelancerEmail: { type: String, required: true },
  description: { type: String },
  completedAt: { type: Date },
  cancelledAt: { type: Date }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export { Order }; 
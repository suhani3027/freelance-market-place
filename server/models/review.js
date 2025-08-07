import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  clientId: {
    type: String,
    required: true
  },
  freelancerId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  clientName: {
    type: String,
    required: true
  },
  gigTitle: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
reviewSchema.index({ gigId: 1, createdAt: -1 });
reviewSchema.index({ freelancerId: 1, createdAt: -1 });
reviewSchema.index({ clientId: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema); 
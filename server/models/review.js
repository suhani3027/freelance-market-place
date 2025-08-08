import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // Review type: 'gig' or 'profile'
  reviewType: {
    type: String,
    enum: ['gig', 'profile'],
    required: true
  },
  
  // For gig reviews
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // For profile reviews
  profileId: {
    type: String // email of the profile being reviewed
  },
  
  // Review details
  reviewerId: {
    type: String, // email of the person leaving the review
    required: true
  },
  reviewerName: {
    type: String,
    required: true
  },
  reviewerRole: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true
  },
  
  // Target of the review
  targetId: {
    type: String, // email of the person being reviewed
    required: true
  },
  targetName: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true
  },
  
  // Review content
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
  title: {
    type: String,
    maxlength: 200
  },
  
  // Additional fields
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: String // array of user emails who found it helpful
  }],
  
  // For gig reviews
  gigTitle: {
    type: String
  },
  
  // Review status
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
reviewSchema.index({ reviewType: 1, gigId: 1, createdAt: -1 });
reviewSchema.index({ reviewType: 1, profileId: 1, createdAt: -1 });
reviewSchema.index({ targetId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1, createdAt: -1 });

// Update the updatedAt field before saving
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Review = mongoose.model('Review', reviewSchema); 
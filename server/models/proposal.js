import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  gigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  freelancerId: {
    type: String, // email
    required: true
  },
  clientId: {
    type: String, // email
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  proposal: {
    type: String,
    required: true,
    minlength: 50
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedDuration: {
    type: String,
    required: true
  },
  freelancerProfile: {
    name: String,
    title: String,
    overview: String,
    skills: [String],
    hourlyRate: Number,
    experienceLevel: String,
    location: String,
    profilePhoto: String
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  clientFeedback: {
    type: String
  },
  freelancerFeedback: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
proposalSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true });
proposalSchema.index({ status: 1 });
proposalSchema.index({ freelancerId: 1 });
proposalSchema.index({ clientId: 1 });

export const Proposal = mongoose.model('Proposal', proposalSchema); 
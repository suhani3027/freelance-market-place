import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema({
  gigId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
  freelancerId: { type: String, required: true }, // use email for now
  coverLetter: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

const Proposal = mongoose.models.Proposal || mongoose.model("Proposal", proposalSchema);

export { Proposal }; 
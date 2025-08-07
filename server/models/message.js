// server/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true }
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export { Message };

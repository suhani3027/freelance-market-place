// server/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderEmail: { type: String, required: true },
  recipientEmail: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export { Message };

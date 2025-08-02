// server/controllers/messageController.js

import Message from '../models/message.js';

// POST /messages
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const message = await Message.create({ senderId, receiverId, content });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// GET /messages/:userId/:chatPartnerId
export const getMessages = async (req, res) => {
  const { userId, chatPartnerId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: chatPartnerId },
        { senderId: chatPartnerId, receiverId: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
};

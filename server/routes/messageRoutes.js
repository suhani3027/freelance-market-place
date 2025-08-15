import express from 'express';
import { sendMessage, getConversation, getUserConversations } from '../controllers/messageController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { Message } from '../models/message.js';

const router = express.Router();

// Send a message
router.post('/', authenticateJWT, sendMessage);

// Get conversation between two users
router.get('/conversation/:otherUserEmail', authenticateJWT, getConversation);

// Get all conversations for the authenticated user
router.get('/conversations', authenticateJWT, getUserConversations);

// Get unread message count
router.get('/unread-count', authenticateJWT, async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const unreadCount = await Message.countDocuments({
      recipientEmail: userEmail,
      isRead: false
    });
    
    res.json({ count: unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

export default router; 
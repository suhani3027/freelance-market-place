import express from 'express';
import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import Connection from '../models/connection.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { notifyNewMessage } from '../services/notificationService.js';

const router = express.Router();

// Send a message (only to connected users)
router.post('/send', authenticateJWT, async (req, res) => {
  try {
    const { recipientEmail, content } = req.body;
    const senderId = req.user.id;

    // Find recipient user
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found.' });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requester: senderId, recipient: recipient._id, status: 'accepted' },
        { requester: recipient._id, recipient: senderId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'You can only message connected users.' });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipient._id,
      content,
      connectionId: connection._id
    });

    await message.save();
    
    // Populate sender info for response
    await message.populate('sender', 'name email');
    
    // Send notification for new message
    const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    await notifyNewMessage(senderId, recipient._id, messagePreview);
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversation between two users
router.get('/conversation/:userEmail', authenticateJWT, async (req, res) => {
  try {
    const { userEmail } = req.params;
    const myId = req.user.id;

    // Find the other user
    const otherUser = await User.findOne({ email: userEmail });
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: otherUser._id, status: 'accepted' },
        { requester: otherUser._id, recipient: myId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'You can only view conversations with connected users.' });
    }

    // Get messages between the two users
    const messages = await Message.find({
      connectionId: connection._id
    })
    .populate('sender', 'name email')
    .populate('recipient', 'name email')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all conversations for a user
router.get('/conversations', authenticateJWT, async (req, res) => {
  try {
    const myId = req.user.id;

    // Get all connections where user is involved
    const connections = await Connection.find({
      $or: [
        { requester: myId, status: 'accepted' },
        { recipient: myId, status: 'accepted' }
      ]
    }).populate('requester recipient', 'name email');

    // Get latest message for each connection
    const conversations = await Promise.all(
      connections.map(async (connection) => {
        const latestMessage = await Message.findOne({
          connectionId: connection._id
        })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .limit(1);

        const otherUser = connection.requester._id.toString() === myId 
          ? connection.recipient 
          : connection.requester;

        return {
          connectionId: connection._id,
          otherUser,
          latestMessage,
          unreadCount: await Message.countDocuments({
            connectionId: connection._id,
            recipient: myId,
            read: false
          })
        };
      })
    );

    // Sort by latest message time
    conversations.sort((a, b) => {
      if (!a.latestMessage && !b.latestMessage) return 0;
      if (!a.latestMessage) return 1;
      if (!b.latestMessage) return -1;
      return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime();
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/read/:userEmail', authenticateJWT, async (req, res) => {
  try {
    const { userEmail } = req.params;
    const myId = req.user.id;

    const otherUser = await User.findOne({ email: userEmail });
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: otherUser._id, status: 'accepted' },
        { requester: otherUser._id, recipient: myId, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'Connection not found.' });
    }

    await Message.updateMany(
      {
        connectionId: connection._id,
        recipient: myId,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 
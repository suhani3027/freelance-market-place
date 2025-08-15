// server/controllers/messageController.js

import { Message } from '../models/message.js';
import { Connection } from '../models/connection.js';
import { io } from '../server.js';

// Send a message (only between connected users)
export const sendMessage = async (req, res) => {
  try {
    const { recipientEmail, content } = req.body;
    const senderEmail = req.user.email;

    if (!recipientEmail || !content) {
      return res.status(400).json({ message: 'Recipient email and content are required' });
    }

    if (senderEmail === recipientEmail) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requesterEmail: senderEmail, recipientEmail: recipientEmail, status: 'accepted' },
        { requesterEmail: recipientEmail, recipientEmail: senderEmail, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'You can only send messages to connected users' });
    }

    const message = new Message({
      senderEmail,
      recipientEmail,
      content,
      timestamp: new Date()
    });

    await message.save();

    // Return enhanced message structure
    const enhancedMessage = {
      _id: message._id,
      content: message.content,
      timestamp: message.timestamp,
      isRead: message.isRead,
      sender: {
        email: message.senderEmail,
        name: message.senderEmail.split('@')[0],
        profilePhoto: null
      },
      recipient: {
        email: message.recipientEmail,
        name: message.recipientEmail.split('@')[0]
      }
    };

    // Emit a real-time notification to the recipient's room
    try {
      const senderName = enhancedMessage.sender.name || senderEmail;
      io.to(recipientEmail).emit('notification', {
        type: 'new',
        notification: {
          id: `msg_${enhancedMessage._id}`,
          type: 'message',
          title: 'New Message',
          message: `${senderName} sent you a message`,
          data: {
            senderEmail,
            content: enhancedMessage.content
          },
          createdAt: new Date().toISOString()
        }
      });
    } catch (emitErr) {
      console.warn('Socket emit for new message failed (continuing):', emitErr.message);
    }

    res.status(201).json(enhancedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Get conversation between two users (only if connected)
export const getConversation = async (req, res) => {
  try {
    const { otherUserEmail } = req.params;
    const userEmail = req.user.email;

    if (userEmail === otherUserEmail) {
      return res.status(400).json({ message: 'Cannot get conversation with yourself' });
    }

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { requesterEmail: userEmail, recipientEmail: otherUserEmail, status: 'accepted' },
        { requesterEmail: otherUserEmail, recipientEmail: userEmail, status: 'accepted' }
      ]
    });

    if (!connection) {
      return res.status(403).json({ message: 'You can only view conversations with connected users' });
    }

    const messages = await Message.find({
      $or: [
        { senderEmail: userEmail, recipientEmail: otherUserEmail },
        { senderEmail: otherUserEmail, recipientEmail: userEmail }
      ]
    }).sort({ timestamp: 1 });

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        senderEmail: otherUserEmail,
        recipientEmail: userEmail,
        isRead: false
      },
      { isRead: true }
    );

    // Enhance messages with sender information
    const enhancedMessages = messages.map(message => ({
      _id: message._id,
      content: message.content,
      timestamp: message.timestamp,
      isRead: message.isRead,
      senderEmail: message.senderEmail, // Add this for client-side logic
      recipientEmail: message.recipientEmail, // Add this for client-side logic
      createdAt: message.timestamp, // Add this for client-side time display
      sender: {
        email: message.senderEmail,
        name: message.senderEmail.split('@')[0], // Use email prefix as name for now
        profilePhoto: null
      },
      recipient: {
        email: message.recipientEmail,
        name: message.recipientEmail.split('@')[0]
      }
    }));

    res.json(enhancedMessages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get all messages where user is sender or recipient
    const messages = await Message.find({
      $or: [
        { senderEmail: userEmail },
        { recipientEmail: userEmail }
      ]
    }).sort({ timestamp: -1 });

    // Group messages by conversation partner
    const conversations = {};
    messages.forEach(message => {
      const partnerEmail = message.senderEmail === userEmail ? message.recipientEmail : message.senderEmail;
      
      if (!conversations[partnerEmail]) {
        conversations[partnerEmail] = {
          _id: `conv_${partnerEmail}`,
          otherUser: partnerEmail, // This should be a string, not an object
          lastMessage: {
            content: message.content,
            timestamp: message.timestamp
          },
          unreadCount: 0
        };
      }
      
      // Count unread messages
      if (message.recipientEmail === userEmail && !message.isRead) {
        conversations[partnerEmail].unreadCount++;
      }
    });

    // Convert to array and sort by last message time
    const conversationsArray = Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );

    res.json(conversationsArray);
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userEmail = req.user.email;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipientEmail !== userEmail) {
      return res.status(403).json({ message: 'You can only mark messages sent to you as read' });
    }

    message.isRead = true;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
};

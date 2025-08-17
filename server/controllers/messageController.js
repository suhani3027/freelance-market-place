// server/controllers/messageController.js

import { Message } from '../models/message.js';
import { Connection } from '../models/connection.js';
import { io } from '../server.js';
import { notifyNewMessage } from '../services/notificationService.js';

// Send a message (only between connected users)
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderEmail = req.user.email;

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content are required' });
    }

    // Extract recipient email from conversation ID (format: conv_recipientEmail)
    const recipientEmail = conversationId.replace('conv_', '');

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
      createdAt: message.timestamp,
      isRead: message.isRead,
      sender: senderEmail,
      recipient: recipientEmail,
      senderEmail: senderEmail,
      recipientEmail: recipientEmail
    };

    // Emit a real-time notification to the recipient's room
    try {
      const senderName = senderEmail.split('@')[0];
      
      // Create notification in database
      await notifyNewMessage(
        senderEmail,
        recipientEmail,
        senderName,
        content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        conversationId
      );
      
      // Emit real-time notification via Socket.io
      io.to(recipientEmail).emit('notification', {
        type: 'new',
        notification: {
          id: `msg_${enhancedMessage._id}`,
          type: 'new_message',
          title: 'New Message',
          message: `${senderName} sent you a message`,
          data: {
            senderEmail,
            content: enhancedMessage.content,
            conversationId,
            action: 'view_messages'
          },
          createdAt: new Date().toISOString()
        }
      });
      
      // Also emit to sender's room for confirmation
      io.to(senderEmail).emit('message_sent', {
        type: 'success',
        message: 'Message sent successfully',
        data: enhancedMessage
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

// Get messages by conversation ID
export const getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userEmail = req.user.email;

    // Extract recipient email from conversation ID (format: conv_recipientEmail)
    const otherUserEmail = conversationId.replace('conv_', '');

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
      createdAt: message.timestamp,
      isRead: message.isRead,
      sender: message.senderEmail,
      recipient: message.recipientEmail,
      senderEmail: message.senderEmail,
      recipientEmail: message.recipientEmail
    }));

    res.json(enhancedMessages);
  } catch (error) {
    console.error('Get messages by conversation error:', error);
    res.status(500).json({ message: 'Failed to get messages' });
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
      createdAt: message.timestamp,
      isRead: message.isRead,
      sender: message.senderEmail,
      recipient: message.recipientEmail,
      senderEmail: message.senderEmail,
      recipientEmail: message.recipientEmail
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
          participants: [
            { email: userEmail, name: userEmail.split('@')[0] },
            { email: partnerEmail, name: partnerEmail.split('@')[0] }
          ],
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
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
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
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

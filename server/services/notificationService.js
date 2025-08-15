import { Notification } from '../models/notification.js';
import { io } from '../server.js';

// Create a new notification
export const createNotification = async (recipientId, type, title, message, data = {}, senderId = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId || recipientId, // Use recipient as sender if not provided
      type,
      title,
      message,
      data,
      read: false
    });

    await notification.save();

    // Emit real-time notification via Socket.io
    io.to(recipientId).emit('notification', {
      type: 'new',
      notification: {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notify user about new connection request
export const notifyConnectionRequest = async (requesterId, recipientId, requesterName) => {
  try {
    const notification = await createNotification(
      recipientId,
      'connection_request',
      'New Connection Request',
      `${requesterName} wants to connect with you`,
      {
        requesterId,
        requesterName,
        action: 'view_connection_requests'
      },
      requesterId // sender ID
    );

    return notification;
  } catch (error) {
    console.error('Error notifying connection request:', error);
    throw error;
  }
};

// Notify user about accepted connection request
export const notifyConnectionAccepted = async (requesterId, recipientId, recipientName) => {
  try {
    const notification = await createNotification(
      requesterId,
      'connection_accepted',
      'Connection Accepted',
      `${recipientName} accepted your connection request`,
      {
        recipientId,
        recipientName,
        action: 'view_connections'
      },
      recipientId // sender ID
    );

    return notification;
  } catch (error) {
    console.error('Error notifying connection accepted:', error);
    throw error;
  }
};

// Notify user about rejected connection request
export const notifyConnectionRejected = async (requesterId, recipientId, recipientName) => {
  try {
    const notification = await createNotification(
      requesterId,
      'connection_rejected',
      'Connection Request Rejected',
      `${recipientName} rejected your connection request`,
      {
        recipientId,
        recipientName,
        action: 'none'
      },
      recipientId // sender ID
    );

    return notification;
  } catch (error) {
    console.error('Error notifying connection rejected:', error);
    throw error;
  }
};

// Notify user about new message
export const notifyNewMessage = async (senderId, recipientId, senderName, messagePreview) => {
  try {
    const notification = await createNotification(
      recipientId,
      'new_message',
      'New Message',
      `New message from ${senderName}: ${messagePreview}`,
      {
        senderId,
        senderName,
        messagePreview,
        action: 'view_messages'
      }
    );

    return notification;
  } catch (error) {
    console.error('Error notifying new message:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (notification) {
      // Emit real-time update via Socket.io
      io.to(userId).emit('notification', {
        type: 'read',
        notificationId: notification._id
      });
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Get user's notifications
export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

// Delete old notifications (cleanup)
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
}; 
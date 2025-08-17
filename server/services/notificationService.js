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

// Enhanced message notification with better context
export const notifyNewMessage = async (senderId, recipientId, senderName, messagePreview, conversationId) => {
  try {
    const notification = await createNotification(
      recipientId,
      'new_message',
      'New Message',
      `New message from ${senderId}: ${messagePreview}`,
      {
        senderId,
        senderName,
        messagePreview,
        conversationId,
        action: 'view_messages'
      },
      senderId
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
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (notification) {
      // Emit real-time update via Socket.io
      try {
        const { io } = await import('../server.js');
        io.to(userId).emit('notification', {
          type: 'read',
          notificationId: notification._id
        });
      } catch (socketError) {
        console.log('Socket.io not available for notification update');
      }
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Emit real-time update via Socket.io
    try {
      const { io } = await import('../server.js');
      io.to(userId).emit('notification', {
        type: 'all_read'
      });
    } catch (socketError) {
      console.log('Socket.io not available for notification update');
    }

    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get user's notifications
export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const notifications = await Notification.find({ recipient: userId })
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
      recipient: userId, 
      read: false 
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

// Notify client about new proposal
export const notifyNewProposal = async (clientId, freelancerId, gigId, gigTitle, freelancerName, proposalPreview) => {
  try {
    const notification = await createNotification(
      clientId,
      'new_proposal',
      'New Proposal Received',
      `${freelancerName} submitted a proposal for "${gigTitle}"`,
      {
        gigId,
        gigTitle,
        freelancerId,
        freelancerName,
        proposalPreview: proposalPreview.substring(0, 100) + (proposalPreview.length > 100 ? '...' : ''),
        action: 'view_proposals'
      },
      freelancerId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying new proposal:', error);
    throw error;
  }
};

// Notify freelancer about proposal accepted
export const notifyProposalAccepted = async (freelancerId, clientId, gigId, gigTitle, clientName) => {
  try {
    const notification = await createNotification(
      freelancerId,
      'proposal_accepted',
      'Proposal Accepted!',
      `Your proposal for "${gigTitle}" has been accepted by ${clientName}`,
      {
        gigId,
        gigTitle,
        clientId,
        clientName,
        action: 'view_orders'
      },
      clientId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying proposal accepted:', error);
    throw error;
  }
};

// Notify freelancer about proposal rejected
export const notifyProposalRejected = async (freelancerId, clientId, gigId, gigTitle, clientName) => {
  try {
    const notification = await createNotification(
      freelancerId,
      'proposal_rejected',
      'Proposal Update',
      `Your proposal for "${gigTitle}" was not selected by ${clientName}`,
      {
        gigId,
        gigTitle,
        clientId,
        clientName,
        action: 'view_proposals'
      },
      clientId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying proposal rejected:', error);
    throw error;
  }
};

// Generic notification sender function
export const sendNotification = async (recipientId, type, data = {}) => {
  try {
    let title, message;
    
    switch (type) {
      case 'proposal_accepted':
        title = 'Proposal Accepted!';
        message = `Your proposal for "${data.gigTitle || 'a gig'}" has been accepted by ${data.clientName || 'the client'}`;
        break;
      case 'proposal_rejected':
        title = 'Proposal Update';
        message = `Your proposal for "${data.gigTitle || 'a gig'}" was not selected by ${data.clientName || 'the client'}`;
        break;
      case 'new_proposal':
        title = 'New Proposal Received';
        message = `You have a new proposal for "${data.gigTitle || 'your gig'}" from ${data.freelancerName || 'a freelancer'}`;
        break;
      case 'gig_completed':
        title = 'Project Completed!';
        message = `Your project "${data.gigTitle || 'has been completed'}" by ${data.freelancerName || 'the freelancer'}`;
        break;
      case 'payment_received':
        title = 'Payment Received!';
        message = `Payment of $${data.amount || '0'} has been received for your completed project`;
        break;
      case 'new_message':
        title = 'New Message';
        message = `New message from ${data.senderName || 'a user'}: ${data.messagePreview || ''}`;
        break;
      case 'order_created':
        title = 'Order Created';
        message = `New order created for project: ${data.gigTitle || 'your project'}`;
        break;
      case 'order_status_updated':
        title = 'Order Status Updated';
        message = `Your order status has been updated to: ${data.status || 'updated'}`;
        break;
      default:
        title = 'Notification';
        message = 'You have a new notification';
    }
    
    const notification = await createNotification(
      recipientId,
      type,
      title,
      message,
      data
    );

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Notify when gig is completed
export const notifyGigCompleted = async (clientId, freelancerId, gigId, gigTitle, freelancerName) => {
  try {
    const notification = await createNotification(
      clientId,
      'gig_completed',
      'Project Completed!',
      `Your project "${gigTitle}" has been completed by ${freelancerName}`,
      {
        gigId,
        gigTitle,
        freelancerId,
        freelancerName,
        action: 'view_orders'
      },
      freelancerId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying gig completion:', error);
    throw error;
  }
};

// Notify when payment is received
export const notifyPaymentReceived = async (freelancerId, clientId, gigId, gigTitle, amount, clientName) => {
  try {
    const notification = await createNotification(
      freelancerId,
      'payment_received',
      'Payment Received!',
      `Payment of $${amount} has been received for your completed project "${gigTitle}"`,
      {
        gigId,
        gigTitle,
        clientId,
        clientName,
        amount,
        action: 'view_earnings'
      },
      clientId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying payment received:', error);
    throw error;
  }
};

// Notify when order is created
export const notifyOrderCreated = async (clientId, freelancerId, gigId, gigTitle, amount, clientName) => {
  try {
    const notification = await createNotification(
      freelancerId,
      'order_created',
      'New Order Created',
      `New order created for project "${gigTitle}" from ${clientName}`,
      {
        gigId,
        gigTitle,
        clientId,
        clientName,
        amount,
        action: 'view_orders'
      },
      clientId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying order created:', error);
    throw error;
  }
};

// Notify when order status is updated
export const notifyOrderStatusUpdated = async (userId, gigId, gigTitle, status, updaterName) => {
  try {
    const notification = await createNotification(
      userId,
      'order_status_updated',
      'Order Status Updated',
      `Your order for "${gigTitle}" has been updated to: ${status}`,
      {
        gigId,
        gigTitle,
        status,
        updaterName,
        action: 'view_orders'
      },
      updaterName
    );

    return notification;
  } catch (error) {
    console.error('Error notifying order status update:', error);
    throw error;
  }
};

// Notify when a new gig is created (for relevant freelancers)
export const notifyNewGigCreated = async (clientId, gigId, gigTitle, skills, budget) => {
  try {
    // Find freelancers with matching skills
    const { FreelancerProfile } = await import('../models/freelancerProfile.js');
    const matchingFreelancers = await FreelancerProfile.find({
      skills: { $in: skills }
    }).limit(10); // Limit to prevent spam
    
    const notifications = [];
    
    for (const freelancer of matchingFreelancers) {
      try {
        const notification = await createNotification(
          freelancer.email,
          'new_gig',
          'New Gig Available',
          `New gig "${gigTitle}" matches your skills. Budget: $${budget}`,
          {
            gigId,
            gigTitle,
            skills,
            budget,
            clientId,
            action: 'view_gig'
          },
          clientId
        );
        notifications.push(notification);
      } catch (error) {
        console.error(`Failed to notify freelancer ${freelancer.email}:`, error);
      }
    }
    
    return notifications;
  } catch (error) {
    console.error('Error notifying new gig created:', error);
    throw error;
  }
};

// Notify when a gig is updated
export const notifyGigUpdated = async (clientId, gigId, gigTitle, freelancerId) => {
  if (!freelancerId) return; // Only notify if there's an assigned freelancer
  
  try {
    const notification = await createNotification(
      freelancerId,
      'gig_updated',
      'Gig Updated',
      `The gig "${gigTitle}" has been updated by the client`,
      {
        gigId,
        gigTitle,
        clientId,
        action: 'view_gig'
      },
      clientId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying gig updated:', error);
    throw error;
  }
};

// Notify when a review is received
export const notifyReviewReceived = async (recipientId, reviewerId, reviewerName, gigId, gigTitle, rating) => {
  try {
    const notification = await createNotification(
      recipientId,
      'review_received',
      'New Review Received',
      `You received a ${rating}-star review from ${reviewerName} for "${gigTitle}"`,
      {
        gigId,
        gigTitle,
        reviewerId,
        reviewerName,
        rating,
        action: 'view_reviews'
      },
      reviewerId
    );

    return notification;
  } catch (error) {
    console.error('Error notifying review received:', error);
    throw error;
  }
};

// Notify when a milestone is reached
export const notifyMilestoneReached = async (clientId, freelancerId, gigId, gigTitle, milestoneName) => {
  try {
    // Notify both client and freelancer
    const notifications = [];
    
    // Notify client
    const clientNotification = await createNotification(
      clientId,
      'milestone_reached',
      'Milestone Reached',
      `Milestone "${milestoneName}" has been reached for project "${gigTitle}"`,
      {
        gigId,
        gigTitle,
        milestoneName,
        action: 'view_project'
      },
      freelancerId
    );
    notifications.push(clientNotification);
    
    // Notify freelancer
    const freelancerNotification = await createNotification(
      freelancerId,
      'milestone_reached',
      'Milestone Reached',
      `Congratulations! You've reached the "${milestoneName}" milestone for "${gigTitle}"`,
      {
        gigId,
        gigTitle,
        milestoneName,
        action: 'view_project'
      },
      freelancerId
    );
    notifications.push(freelancerNotification);
    
    return notifications;
  } catch (error) {
    console.error('Error notifying milestone reached:', error);
    throw error;
  }
}; 
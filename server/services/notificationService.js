import { Notification } from '../models/notification.js';
import { User } from '../models/user.js';

export const createNotification = async (recipientId, senderId, type, title, message, relatedId = null, relatedType = null, data = {}) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      data
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Connection request notification
export const notifyConnectionRequest = async (requesterId, recipientId) => {
  const requester = await User.findById(requesterId);
  if (!requester) return;
  
  return createNotification(
    recipientId,
    requesterId,
    'connection_request',
    'New Connection Request',
    `${requester.name || requester.email.split('@')[0]} wants to connect with you`,
    null,
    'connection'
  );
};

// Connection accepted notification
export const notifyConnectionAccepted = async (accepterId, requesterId) => {
  const accepter = await User.findById(accepterId);
  if (!accepter) return;
  
  return createNotification(
    requesterId,
    accepterId,
    'connection_accepted',
    'Connection Accepted',
    `${accepter.name || accepter.email.split('@')[0]} accepted your connection request`,
    null,
    'connection'
  );
};

// Connection rejected notification
export const notifyConnectionRejected = async (rejecterId, requesterId) => {
  const rejecter = await User.findById(rejecterId);
  if (!rejecter) return;
  
  return createNotification(
    requesterId,
    rejecterId,
    'connection_rejected',
    'Connection Request Declined',
    `${rejecter.name || rejecter.email.split('@')[0]} declined your connection request`,
    null,
    'connection'
  );
};

// Gig proposal notification
export const notifyGigProposal = async (proposalId, gigId, freelancerId, clientId, proposalAmount) => {
  const freelancer = await User.findById(freelancerId);
  if (!freelancer) return;
  
  return createNotification(
    clientId,
    freelancerId,
    'gig_proposal',
    'New Proposal Received',
    `${freelancer.name || freelancer.email.split('@')[0]} submitted a proposal for ₹${proposalAmount}`,
    proposalId,
    'proposal',
    { gigId, proposalAmount }
  );
};

// New message notification
export const notifyNewMessage = async (senderId, recipientId, messagePreview) => {
  const sender = await User.findById(senderId);
  if (!sender) return;
  
  return createNotification(
    recipientId,
    senderId,
    'message',
    'New Message',
    `${sender.name || sender.email.split('@')[0]}: ${messagePreview}`,
    null,
    'message'
  );
};

// Gig created notification (for followers/connections)
export const notifyGigCreated = async (gigId, clientId, gigTitle) => {
  // This could be expanded to notify followers or connections
  // For now, we'll just create a placeholder
  return createNotification(
    clientId, // Self notification
    clientId,
    'gig_created',
    'Gig Created Successfully',
    `Your gig "${gigTitle}" has been published`,
    gigId,
    'gig'
  );
};

// Profile review notification
export const notifyProfileReview = async (reviewerId, profileOwnerId, reviewRating, isAnonymous = false) => {
  const reviewer = await User.findById(reviewerId);
  if (!reviewer) return;
  
  const reviewerName = isAnonymous ? 'Anonymous' : (reviewer.name || reviewer.email.split('@')[0]);
  
  return createNotification(
    profileOwnerId,
    reviewerId,
    'profile_review',
    'New Profile Review',
    `${reviewerName} left you a ${reviewRating}-star review`,
    null,
    'review',
    { rating: reviewRating, isAnonymous }
  );
}; 
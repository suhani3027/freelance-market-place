import { Connection } from '../models/connection.js';
import { User } from '../models/user.js';
import { FreelancerProfile } from '../models/freelancerProfile.js';
import { 
  notifyConnectionRequest, 
  notifyConnectionAccepted, 
  notifyConnectionRejected 
} from '../services/notificationService.js';

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { recipientEmail, message } = req.body;
    const requesterEmail = req.user.email;

    if (requesterEmail === recipientEmail) {
      return res.status(400).json({ message: 'You cannot connect with yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterEmail, recipientEmail },
        { requesterEmail: recipientEmail, recipientEmail: requesterEmail }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return res.status(400).json({ message: 'Connection request already pending' });
      } else if (existingConnection.status === 'accepted') {
        return res.status(400).json({ message: 'You are already connected with this user' });
      }
    }

    // Get requester info
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) {
      return res.status(404).json({ message: 'Requester not found' });
    }

    // Create new connection request
    const connection = new Connection({
      requesterId: requester._id.toString(),
      requesterEmail: requester.email,
      requesterName: requester.name,
      recipientId: recipient._id.toString(),
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      message: message || '',
      status: 'pending'
    });

    await connection.save();

    // Create notification for recipient
    try {
      await notifyConnectionRequest(
        requester._id.toString(),
        recipient._id.toString(),
        requester.name
      );
    } catch (notificationError) {
      console.error('Failed to create connection request notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({ 
      message: 'Connection request sent successfully',
      connection 
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Failed to send connection request' });
  }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userEmail = req.user.email;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipientEmail !== userEmail) {
      return res.status(403).json({ message: 'You can only accept requests sent to you' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is not pending' });
    }

    connection.status = 'accepted';
    connection.acceptedAt = new Date();
    connection.isRead = true;
    await connection.save();

    // Create notification for requester
    try {
      await notifyConnectionAccepted(
        connection.requesterId,
        connection.recipientId,
        connection.recipientName
      );
    } catch (notificationError) {
      console.error('Failed to create connection accepted notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      message: 'Connection request accepted successfully',
      connection 
    });
  } catch (error) {
    console.error('Accept connection request error:', error);
    res.status(500).json({ message: 'Failed to accept connection request' });
  }
};

// Reject connection request
export const rejectConnectionRequest = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userEmail = req.user.email;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipientEmail !== userEmail) {
      return res.status(403).json({ message: 'You can only reject requests sent to you' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Connection request is not pending' });
    }

    connection.status = 'rejected';
    connection.rejectedAt = new Date();
    connection.isRead = true;
    await connection.save();

    // Create notification for requester
    try {
      await notifyConnectionRejected(
        connection.requesterId,
        connection.recipientId,
        connection.recipientName
      );
    } catch (notificationError) {
      console.error('Failed to create connection rejected notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({ 
      message: 'Connection request rejected successfully',
      connection 
    });
  } catch (error) {
    console.error('Reject connection request error:', error);
    res.status(500).json({ message: 'Failed to reject connection request' });
  }
};

// Get user's connections
export const getUserConnections = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const connections = await Connection.find({
      $or: [
        { requesterEmail: userEmail },
        { recipientEmail: userEmail }
      ],
      status: 'accepted'
    }).sort({ updatedAt: -1 });

    res.json(connections);
  } catch (error) {
    console.error('Get user connections error:', error);
    res.status(500).json({ message: 'Failed to get connections' });
  }
};

// Get pending connection requests
export const getPendingRequests = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const pendingRequests = await Connection.find({
      recipientEmail: userEmail,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json(pendingRequests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Failed to get pending requests' });
  }
};

// Check if two users are connected
export const checkConnectionStatus = async (req, res) => {
  try {
    const { otherUserEmail } = req.params;
    const userEmail = req.user.email;

    if (userEmail === otherUserEmail) {
      return res.json({ status: 'self' });
    }

    const connection = await Connection.findOne({
      $or: [
        { requesterEmail: userEmail, recipientEmail: otherUserEmail },
        { requesterEmail: otherUserEmail, recipientEmail: userEmail }
      ]
    });

    if (!connection) {
      return res.json({ status: 'none' });
    }

    res.json({ 
      status: connection.status,
      connection 
    });
  } catch (error) {
    console.error('Check connection status error:', error);
    res.status(500).json({ message: 'Failed to check connection status' });
  }
};

// Remove connection
export const removeConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userEmail = req.user.email;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.requesterEmail !== userEmail && connection.recipientEmail !== userEmail) {
      return res.status(403).json({ message: 'You can only remove your own connections' });
    }

    if (connection.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only remove accepted connections' });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ message: 'Failed to remove connection' });
  }
}; 


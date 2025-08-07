import Connection from '../models/connection.js';
import { User } from '../models/user.js';
import mongoose from 'mongoose';
import { notifyConnectionRequest, notifyConnectionAccepted, notifyConnectionRejected } from '../services/notificationService.js';

// Send a connection request
export const sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body; // This is actually an email
    const requesterId = req.user.id;
    
    // Find the recipient user by email
    const recipientUser = await User.findOne({ email: recipientId });
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }
    
    if (requesterId === recipientUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect to yourself.' });
    }
    
    // Check for existing connection in either direction
    const existing = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientUser._id },
        { requester: recipientUser._id, recipient: requesterId }
      ]
    });
    
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected.' });
      } else if (existing.status === 'pending') {
        if (existing.requester.toString() === requesterId) {
          return res.status(400).json({ message: 'Request already sent.' });
        } else {
          return res.status(400).json({ message: 'You have a pending request from this user.' });
        }
      } else if (existing.status === 'rejected') {
        // Update rejected request to pending
        existing.status = 'pending';
        existing.requester = requesterId;
        existing.recipient = recipientUser._id;
        existing.updatedAt = Date.now();
        await existing.save();
        
        // Send notification for the new request
        await notifyConnectionRequest(requesterId, recipientUser._id);
        
        return res.status(200).json(existing);
      }
    }
    
    const connection = new Connection({ 
      requester: requesterId, 
      recipient: recipientUser._id,
      status: 'pending'
    });
    await connection.save();
    
    // Send notification
    await notifyConnectionRequest(requesterId, recipientUser._id);
    
    res.status(201).json(connection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Accept a connection request
export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const connection = await Connection.findById(requestId);
    if (!connection) return res.status(404).json({ message: 'Request not found.' });
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    connection.status = 'accepted';
    connection.updatedAt = Date.now();
    await connection.save();
    
    // Send notification to the requester
    await notifyConnectionAccepted(req.user.id, connection.requester);
    
    res.json(connection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject a connection request
export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const connection = await Connection.findById(requestId);
    if (!connection) return res.status(404).json({ message: 'Request not found.' });
    if (connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    connection.status = 'rejected';
    connection.updatedAt = Date.now();
    await connection.save();
    
    // Send notification to the requester
    await notifyConnectionRejected(req.user.id, connection.requester);
    
    res.json(connection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List all connections for a user
export const listConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const connections = await Connection.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' },
      ],
    }).populate('requester recipient', 'name email');
    res.json(connections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List pending requests for a user
export const listPending = async (req, res) => {
  try {
    const userId = req.user.id;
    const pending = await Connection.find({ recipient: userId, status: 'pending' }).populate('requester', 'name email');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get connection status between two users
export const getConnectionStatus = async (req, res) => {
  try {
    const { userId } = req.params; // This is actually an email
    const decodedEmail = decodeURIComponent(userId);
    const myId = req.user.id;
    
    // Find the user by email
    const targetUser = await User.findOne({ email: decodedEmail });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: targetUser._id },
        { requester: targetUser._id, recipient: myId }
      ]
    });
    
    if (!connection) {
      return res.json({ 
        status: 'none',
        message: 'No connection request sent',
        canConnect: true
      });
    }
    
    let status, message, canConnect;
    
    switch (connection.status) {
      case 'pending':
        if (connection.requester.toString() === myId) {
          status = 'pending_sent';
          message = 'Request sent';
          canConnect = false;
        } else {
          status = 'pending_received';
          message = 'Request received';
          canConnect = false;
        }
        break;
      case 'accepted':
        status = 'connected';
        message = 'Connected';
        canConnect = false;
        break;
      case 'rejected':
        status = 'rejected';
        message = 'Request rejected';
        canConnect = true;
        break;
      default:
        status = 'none';
        message = 'No connection';
        canConnect = true;
    }
    
    res.json({
      status,
      message,
      canConnect,
      connectionId: connection._id,
      isRequester: connection.requester.toString() === myId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if two users are connected
export const checkConnection = async (req, res) => {
  try {
    const { userId } = req.params; // This is actually an email
    const decodedEmail = decodeURIComponent(userId);
    const myId = req.user.id;
    
    // Find the user by email
    const targetUser = await User.findOne({ email: decodedEmail });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: targetUser._id, status: 'accepted' },
        { requester: targetUser._id, recipient: myId, status: 'accepted' },
      ],
    });
    res.json({ connected: !!connection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 


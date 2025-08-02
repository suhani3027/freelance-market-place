import Connection from '../models/connection.js';
import { User } from '../models/user.js';
import mongoose from 'mongoose';

// Send a connection request
export const sendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;
    if (requesterId === recipientId) {
      return res.status(400).json({ message: 'Cannot connect to yourself.' });
    }
    const existing = await Connection.findOne({ requester: requesterId, recipient: recipientId });
    if (existing) {
      return res.status(400).json({ message: 'Request already sent.' });
    }
    const connection = new Connection({ requester: requesterId, recipient: recipientId });
    await connection.save();
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

// Check if two users are connected
export const checkConnection = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;
    const connection = await Connection.findOne({
      $or: [
        { requester: myId, recipient: userId, status: 'accepted' },
        { requester: userId, recipient: myId, status: 'accepted' },
      ],
    });
    res.json({ connected: !!connection });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 


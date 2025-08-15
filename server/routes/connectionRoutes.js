import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getUserConnections,
  getPendingRequests,
  checkConnectionStatus,
  removeConnection
} from '../controllers/connectionController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateJWT);

// Send connection request
router.post('/request', sendConnectionRequest);

// Accept connection request
router.put('/accept/:connectionId', acceptConnectionRequest);

// Reject connection request
router.put('/reject/:connectionId', rejectConnectionRequest);

// Get user's accepted connections
router.get('/connections', getUserConnections);

// Get pending connection requests
router.get('/pending', getPendingRequests);

// Check connection status with another user
router.get('/status/:otherUserEmail', checkConnectionStatus);

// Remove connection
router.delete('/:connectionId', removeConnection);

export default router; 
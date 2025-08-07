import express from 'express';
import * as connectionController from '../controllers/connectionController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Send a connection request
router.post('/send', authenticateJWT, connectionController.sendRequest);

// Accept a connection request
router.post('/accept', authenticateJWT, connectionController.acceptRequest);

// Reject a connection request
router.post('/reject', authenticateJWT, connectionController.rejectRequest);

// List all accepted connections for the user
router.get('/list', authenticateJWT, connectionController.listConnections);

// List all pending requests for the user
router.get('/pending', authenticateJWT, connectionController.listPending);

// Get connection status between two users
router.get('/status/:userId', authenticateJWT, connectionController.getConnectionStatus);

// Check if connected with another user
router.get('/check/:userId', authenticateJWT, connectionController.checkConnection);

export default router; 
import express from 'express';
import { 
  createCheckoutSession,
  confirmPayment, 
  getUserOrders, 
  updateOrderStatus, 
  getOrderDetails,
  testStripe,
  testCheckoutSession
} from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test routes (no authentication needed)
router.get('/test-stripe', testStripe);
router.get('/test-checkout-session', testCheckoutSession);

// Payment routes
router.post('/create-checkout-session', authenticateJWT, createCheckoutSession);
router.post('/confirm-payment', authenticateJWT, confirmPayment);

// Order management routes
router.get('/orders/:userId/:role', authenticateJWT, getUserOrders);
router.put('/orders/:orderId/status', authenticateJWT, updateOrderStatus);
router.get('/orders/:orderId', authenticateJWT, getOrderDetails);

export default router; 
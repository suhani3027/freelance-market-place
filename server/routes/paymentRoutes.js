import express from 'express';
import { 
  createPaymentIntent, 
  createCheckoutSession,
  confirmPayment, 
  getUserOrders, 
  updateOrderStatus, 
  getOrderDetails,
  handleStripeWebhook
} from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Payment routes
router.post('/create-payment-intent', authenticateJWT, createPaymentIntent);
router.post('/create-checkout-session', authenticateJWT, createCheckoutSession);
router.post('/confirm-payment', authenticateJWT, confirmPayment);

// Webhook route (no authentication needed)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Order management routes
router.get('/orders/:userId/:role', authenticateJWT, getUserOrders);
router.put('/orders/:orderId/status', authenticateJWT, updateOrderStatus);
router.get('/orders/:orderId', authenticateJWT, getOrderDetails);

export default router; 
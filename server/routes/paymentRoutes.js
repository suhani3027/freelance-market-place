import express from 'express';
import { 
  createCheckoutSession,
  confirmPayment, 
  getUserOrders, 
  updateOrderStatus, 
  getOrderDetails,
  testStripe,
  testCheckoutSession,
  handleStripeWebhook
} from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { Order } from '../models/order.js';

const router = express.Router();

// Test routes (no authentication needed)
router.get('/test-stripe', testStripe);
router.get('/test-checkout-session', testCheckoutSession);

// Stripe webhook (no authentication needed - Stripe handles security)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Payment routes
router.post('/create-checkout-session', authenticateJWT, createCheckoutSession);
router.get('/confirm-payment', authenticateJWT, confirmPayment);

// Get payment details by session ID
router.get('/success', authenticateJWT, async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Find order by Stripe session ID
    const order = await Order.findOne({ stripeSessionId: session_id });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this session' });
    }

    // Check if user is authorized to view this order
    if (order.clientId !== req.user.email && order.freelancerId !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json({
      orderId: order._id,
      amount: order.amount,
      status: order.status,
      gigTitle: order.gigTitle,
      sessionId: session_id
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Order management routes
router.get('/orders/:userId/:role', authenticateJWT, getUserOrders);
router.put('/orders/:orderId/status', authenticateJWT, updateOrderStatus);
router.get('/orders/:orderId', authenticateJWT, getOrderDetails);

export default router; 
import express from 'express';
import { 
  getUserOrders,
  updateOrderStatus, 
  getOrderDetails,
  getAllOrders
} from '../controllers/orderController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { Order } from '../models/order.js';

const router = express.Router();

// Get all orders for the authenticated user
router.get('/', authenticateJWT, getAllOrders);

// Get user orders by role
router.get('/user/:userId/:role', authenticateJWT, getUserOrders);

// Update order status
router.put('/:orderId/status', authenticateJWT, updateOrderStatus);

// Mark order as completed
router.put('/:orderId/complete', authenticateJWT, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user is authorized to complete this order
    if (order.freelancerId !== req.user.email && order.clientId !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to complete this order' });
    }
    
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Mark order completed error:', error);
    res.status(500).json({ error: 'Failed to mark order as completed' });
  }
});

// Get order details
router.get('/:orderId', authenticateJWT, getOrderDetails);

export default router;

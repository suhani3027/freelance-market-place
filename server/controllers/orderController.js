import { Order } from '../models/order.js';
import { Gig } from '../models/gig.js';
import { User } from '../models/user.js';

// Get all orders for the authenticated user
export const getAllOrders = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;
    
    let orders;
    if (userRole === 'client') {
      orders = await Order.find({ clientEmail: userEmail })
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ freelancerEmail: userEmail })
        .sort({ createdAt: -1 });
    }

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      gigTitle: order.gigTitle,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      gigId: order.gigId,
      clientEmail: order.clientEmail,
      freelancerEmail: order.freelancerEmail,
      description: order.description,
      paid: order.status === 'paid' || order.status === 'completed',
      proposalId: order._id // Using order ID as proposal ID for now
    }));

    res.json(transformedOrders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get user orders by role
export const getUserOrders = async (req, res) => {
  try {
    const { userId, role } = req.params;
    
    let orders;
    if (role === 'client') {
      orders = await Order.find({ clientEmail: userId })
        .sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ freelancerEmail: userId })
        .sort({ createdAt: -1 });
    }

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      gigTitle: order.gigTitle,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      gigId: order.gigId,
      clientEmail: order.clientEmail,
      freelancerEmail: order.freelancerEmail,
      description: order.description,
      paid: order.status === 'paid' || order.status === 'completed',
      proposalId: order._id // Using order ID as proposal ID for now
    }));

    res.json(transformedOrders);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate status transition
    const validStatuses = ['pending', 'ongoing', 'completed', 'cancelled', 'pending_payment', 'paid', 'in_progress'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    order.status = status;
    
    // Set completion date if status is completed
    if (status === 'completed') {
      order.completedAt = new Date();
    }
    
    // Set cancellation date if status is cancelled
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
    }

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
      
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Transform order to match frontend expectations
    const transformedOrder = {
      _id: order._id,
      gigTitle: order.gigTitle,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      gigId: order.gigId,
      clientEmail: order.clientEmail,
      freelancerEmail: order.freelancerEmail,
      description: order.description,
      paid: order.status === 'paid' || order.status === 'completed',
      proposalId: order._id // Using order ID as proposal ID for now
    };

    res.json(transformedOrder);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

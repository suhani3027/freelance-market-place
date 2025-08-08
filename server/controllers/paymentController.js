import Stripe from 'stripe';
import { Order } from '../models/order.js';
import { Gig } from '../models/gig.js';
import { User } from '../models/user.js';

// Initialize Stripe with error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not found in environment variables');
    throw new Error('Stripe secret key not configured');
  }
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
  stripe = null;
}

// Create checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service is not configured' });
    }

    const { gigId, clientId, amount, gigTitle } = req.body;
    console.log('Payment request data:', { gigId, clientId, amount, gigTitle });

    // Validate required fields
    if (!gigId || !clientId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: gigId, clientId, amount' });
    }

    // Ensure amount is a valid number
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount provided' });
    }

    // Fetch gig details
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }

    // Fetch client and freelancer details
    const client = await User.findOne({ email: clientId });
    const freelancer = await User.findOne({ email: gig.clientId });

    if (!client || !freelancer) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if order already exists (for both direct gig purchases and completed proposals)
    const existingOrder = await Order.findOne({ 
      gigId, 
      clientId: client.email,
      status: { $in: ['pending', 'paid', 'in_progress'] }
    });

    let order;
    if (existingOrder) {
      // Use existing order if it exists
      order = existingOrder;
      // Update the order amount if it's different (for proposal payments)
      if (existingOrder.amount !== paymentAmount) {
        existingOrder.amount = paymentAmount;
        await existingOrder.save();
      }
    } else {
      // Create new order record
      order = new Order({
        gigId,
        clientId: client.email,
        freelancerId: freelancer.email,
        amount: paymentAmount,
        gigTitle: gigTitle || gig.title,
        clientEmail: client.email,
        freelancerEmail: freelancer.email,
        description: gig.description,
        status: 'pending'
      });

      await order.save();
    }

    console.log('Creating Stripe session with amount:', paymentAmount);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: (gigTitle || gig.title || 'Project Payment').substring(0, 255), // Limit length
              description: (gig.description || 'Project payment').substring(0, 255), // Limit length
            },
            unit_amount: Math.round(paymentAmount * 100), // Convert to cents and ensure integer
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/cancel`,
      metadata: {
        orderId: order._id.toString(),
        gigId: gigId,
        clientId: client.email,
        freelancerId: freelancer.email,
      },
    });

    console.log('Stripe session created successfully:', session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Confirm payment
export const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.query;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status to paid
    order.status = 'paid';
    await order.save();

    // Update proposal status to paid
    try {
      const Proposal = (await import('../models/proposal.js')).Proposal;
      const proposal = await Proposal.findOne({
        gigId: order.gigId,
        clientId: order.clientId,
        freelancerId: order.freelancerId,
        status: 'completed'
      });

      if (proposal) {
        proposal.status = 'paid';
        await proposal.save();
        console.log(`Proposal status updated to paid for order ${order._id}`);
      }
    } catch (proposalError) {
      console.error('Failed to update proposal status:', proposalError);
    }

    // Send notification to freelancer
    try {
      const Notification = (await import('../models/notification.js')).Notification;
      
      // Get user IDs for notification
      const freelancerUser = await User.findOne({ email: order.freelancerId });
      const clientUser = await User.findOne({ email: order.clientId });
      
      if (freelancerUser && clientUser) {
        const notification = new Notification({
          recipient: freelancerUser._id,
          sender: clientUser._id,
          type: 'gig_proposal', // Using existing type since payment_received not in enum
          title: 'Payment Received!',
          message: `Payment of $${order.amount} has been received for "${order.gigTitle}". You can now start working on the project.`,
          relatedId: order._id,
          relatedType: 'order',
          data: {
            orderId: order._id,
            amount: order.amount,
            gigTitle: order.gigTitle
          },
          read: false
        });

        await notification.save();
        console.log(`Notification sent to freelancer ${order.freelancerId} for payment received`);

        // Emit real-time notification via Socket.io
        if (req.app.get('io')) {
          req.app.get('io').emitPaymentNotification(order.freelancerId, {
            type: 'payment_received',
            title: 'Payment Received!',
            message: `Payment of $${order.amount} has been received for "${order.gigTitle}". You can now start working on the project.`,
            orderId: order._id,
            amount: order.amount,
            gigTitle: order.gigTitle
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send payment notification:', notificationError);
      // Don't fail the payment confirmation if notification fails
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const { userId, role } = req.params;
    
    let orders;
    if (role === 'client') {
      orders = await Order.find({ clientId: userId }).populate('gigId');
    } else {
      orders = await Order.find({ freelancerId: userId }).populate('gigId');
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
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

    order.status = status;
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
    
    const order = await Order.findById(orderId).populate('gigId');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
}; 

// Test Stripe connection
export const testStripe = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service is not configured' });
    }

    // Test Stripe connection by getting account details
    const account = await stripe.accounts.retrieve();
    
    res.json({ 
      success: true, 
      message: 'Stripe is working correctly',
      account: {
        id: account.id,
        business_type: account.business_type,
        charges_enabled: account.charges_enabled
      }
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    res.status(500).json({ error: 'Stripe test failed', details: error.message });
  }
}; 

// Test checkout session creation
export const testCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment service is not configured' });
    }

    // Create a simple test checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Payment',
              description: 'Test payment for debugging',
            },
            unit_amount: 100, // $1.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/payment/success',
      cancel_url: 'http://localhost:3000/payment/cancel',
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Test checkout session error:', error);
    res.status(500).json({ 
      error: 'Test checkout session failed', 
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
}; 
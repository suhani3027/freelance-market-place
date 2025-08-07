import Stripe from 'stripe';
import { Order } from '../models/order.js';
import { Gig } from '../models/gig.js';
import { User } from '../models/user.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { gigId, clientId, amount, gigTitle } = req.body;

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

    // Check if order already exists
    const existingOrder = await Order.findOne({ 
      gigId, 
      clientId: client.email,
      status: { $in: ['pending', 'paid', 'in_progress'] }
    });

    if (existingOrder) {
      return res.status(400).json({ error: 'Order already exists for this gig' });
    }

    // Create order record first
    const order = new Order({
      gigId,
      clientId: client.email,
      freelancerId: freelancer.email,
      amount: gig.amount,
      gigTitle: gig.title,
      clientEmail: client.email,
      freelancerEmail: freelancer.email,
      description: gig.description,
      status: 'pending'
    });

    await order.save();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: gigTitle || gig.title,
              description: gig.description,
            },
            unit_amount: gig.amount * 100, // Convert to cents
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

    res.json({
      sessionId: session.id,
      orderId: order._id,
      amount: gig.amount
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// Handle Stripe webhook for successful payments
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Update order status to paid
      const orderId = session.metadata.orderId;
      if (orderId) {
        try {
          const order = await Order.findById(orderId);
          if (order) {
            order.status = 'paid';
            order.stripePaymentIntentId = session.payment_intent;
            await order.save();
            console.log(`Order ${orderId} marked as paid`);
          }
        } catch (error) {
          console.error('Error updating order:', error);
        }
      }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Create payment intent (keeping for backward compatibility)
export const createPaymentIntent = async (req, res) => {
  try {
    const { gigId, clientId } = req.body;

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

    // Check if order already exists
    const existingOrder = await Order.findOne({ 
      gigId, 
      clientId: client.email,
      status: { $in: ['pending', 'paid', 'in_progress'] }
    });

    if (existingOrder) {
      return res.status(400).json({ error: 'Order already exists for this gig' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: gig.amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        gigId,
        clientId: client.email,
        freelancerId: freelancer.email,
        gigTitle: gig.title
      }
    });

    // Create order record
    const order = new Order({
      gigId,
      clientId: client.email,
      freelancerId: freelancer.email,
      amount: gig.amount,
      stripePaymentIntentId: paymentIntent.id,
      gigTitle: gig.title,
      clientEmail: client.email,
      freelancerEmail: freelancer.email,
      description: gig.description
    });

    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      amount: gig.amount
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Confirm payment
export const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      order.status = 'paid';
      await order.save();
      
      res.json({ 
        success: true, 
        message: 'Payment confirmed',
        order: order
      });
    } else {
      res.status(400).json({ error: 'Payment not successful' });
    }

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
    if (status === 'completed') {
      order.completedAt = new Date();
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
    }

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
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

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
}; 
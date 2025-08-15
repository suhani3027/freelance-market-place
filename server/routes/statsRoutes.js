import express from 'express';
import { Gig } from '../models/gig.js';
import { Order } from '../models/order.js';

const router = express.Router();

// GET /api/stats/:role/:email
// Returns dashboard statistics for a given user role and email
router.get('/:role/:email', async (req, res) => {
  try {
    const { role, email } = req.params;
    
    // Stats request received

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    // Normalize role input
    const normalizedRole = String(role).toLowerCase();

    let totalGigs = 0;
    let activeGigs = 0; // For now, we interpret as active orders in progress
    let totalOrders = 0;
    let totalEarnings = 0;

    // Common aggregations for orders
    const ordersMatchByClient = { clientEmail: email };
    const ordersMatchByFreelancer = { freelancerEmail: email };

    if (normalizedRole === 'client') {
      totalGigs = await Gig.countDocuments({ clientId: email });

      // Orders created by this client
      totalOrders = await Order.countDocuments(ordersMatchByClient);

      // Active orders are pending / paid / in_progress
      activeGigs = await Order.countDocuments({
        ...ordersMatchByClient,
        status: { $in: ['pending', 'paid', 'in_progress'] }
      });

      const paidOrders = await Order.aggregate([
        { $match: { ...ordersMatchByClient, status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      totalEarnings = paidOrders.length ? paidOrders[0].sum : 0;
    } else if (normalizedRole === 'freelancer') {
      // For freelancers, compute based on work performed
      // totalGigs: number of distinct gigs they have orders for
      const gigsForFreelancer = await Order.distinct('gigId', ordersMatchByFreelancer);
      totalGigs = gigsForFreelancer.length;

      totalOrders = await Order.countDocuments(ordersMatchByFreelancer);

      activeGigs = await Order.countDocuments({
        ...ordersMatchByFreelancer,
        status: { $in: ['pending', 'paid', 'in_progress'] }
      });

      const earnedAgg = await Order.aggregate([
        { $match: { ...ordersMatchByFreelancer, status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      totalEarnings = earnedAgg.length ? earnedAgg[0].sum : 0;
    } else {
      return res.status(400).json({ message: 'Invalid role. Expected client or freelancer' });
    }

    const stats = { totalGigs, activeGigs, totalOrders, totalEarnings };
    // Stats computed successfully
    return res.json(stats);
  } catch (error) {
    console.error('Error computing stats:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

export default router;



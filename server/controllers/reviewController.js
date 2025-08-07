import { Review } from '../models/review.js';
import { Order } from '../models/order.js';
import { Gig } from '../models/gig.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, isAnonymous } = req.body;
    const clientId = req.user.email;

    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Order must be completed to leave a review' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this order' });
    }

    // Get gig details
    const gig = await Gig.findById(order.gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Get client name
    const clientName = isAnonymous ? 'Anonymous' : req.user.name || 'Anonymous';

    const review = new Review({
      gigId: order.gigId,
      orderId,
      clientId,
      freelancerId: gig.clientId, // The gig owner is the freelancer
      rating,
      comment,
      clientName,
      gigTitle: gig.title,
      isAnonymous
    });

    await review.save();

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a specific gig
export const getGigReviews = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { sort = 'date' } = req.query;

    let sortOption = {};
    if (sort === 'rating') {
      sortOption = { rating: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find({ gigId })
      .sort(sortOption)
      .limit(50);

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching gig reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a freelancer
export const getFreelancerReviews = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    const reviews = await Review.find({ freelancerId })
      .sort({ createdAt: -1 });

    // Calculate average rating and breakdown
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingBreakdown = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.status(200).json({
      reviews,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching freelancer reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get reviews by a client
export const getClientReviews = async (req, res) => {
  try {
    const { clientId } = req.params;

    const reviews = await Review.find({ clientId })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching client reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update review helpful count
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a review (only by the author)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const clientId = req.user.email;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.clientId !== clientId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: error.message });
  }
}; 
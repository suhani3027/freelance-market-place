import { Review } from '../models/review.js';
import { Order } from '../models/order.js';
import { Gig } from '../models/gig.js';
import { User } from '../models/user.js';
import { notifyProfileReview } from '../services/notificationService.js';

// Create a new review (for both gigs and profiles)
export const createReview = async (req, res) => {
  try {
    const { 
      reviewType, 
      gigId, 
      orderId, 
      profileId, 
      targetId, 
      rating, 
      comment, 
      title, 
      isAnonymous 
    } = req.body;
    
    const reviewerId = req.user.email;
    const reviewerRole = req.user.role || 'client';

    // Validate required fields
    if (!reviewType || !targetId || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Missing required fields: reviewType, targetId, rating, comment' 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if user is trying to review themselves
    if (reviewerId === targetId) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    // Get reviewer name
    const reviewerName = isAnonymous ? 'Anonymous' : req.user.name || 'Anonymous';

    // Get target user info
    const targetUser = await User.findOne({ email: targetId });
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const targetName = targetUser.name || targetUser.email;
    const targetRole = targetUser.role || 'freelancer';

    // For gig reviews, validate order completion (optional)
    if (reviewType === 'gig') {
      if (!gigId) {
        return res.status(400).json({ message: 'gigId is required for gig reviews' });
      }

      // Get gig details
      const gig = await Gig.findById(gigId);
      if (!gig) {
        return res.status(404).json({ message: 'Gig not found' });
      }

      // If orderId is provided, validate the order
      if (orderId) {
        const order = await Order.findById(orderId);
        if (!order) {
          return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order is completed
        if (order.status !== 'completed') {
          return res.status(400).json({ message: 'Order must be completed to leave a review' });
        }

        // Check if review already exists for this order
        const existingReview = await Review.findOne({ orderId, reviewType: 'gig' });
        if (existingReview) {
          return res.status(400).json({ message: 'Review already exists for this order' });
        }
      } else {
        // For gig reviews without orderId, check if user has already reviewed this gig
        const existingReview = await Review.findOne({ 
          gigId, 
          reviewerId, 
          reviewType: 'gig',
          orderId: { $exists: false }
        });
        if (existingReview) {
          return res.status(400).json({ message: 'You have already reviewed this gig' });
        }
      }
    }

    // For profile reviews, check if user has worked together
    if (reviewType === 'profile') {
      if (!profileId) {
        return res.status(400).json({ message: 'profileId is required for profile reviews' });
      }

      // Check if review already exists from this reviewer to this target
      const existingReview = await Review.findOne({ 
        reviewType: 'profile',
        reviewerId,
        targetId,
        profileId
      });
      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this profile' });
      }
    }

    const review = new Review({
      reviewType,
      gigId,
      orderId,
      profileId,
      reviewerId,
      reviewerName,
      reviewerRole,
      targetId,
      targetName,
      targetRole,
      rating,
      comment,
      title,
      isAnonymous,
      gigTitle: reviewType === 'gig' ? (await Gig.findById(gigId))?.title : undefined
    });

    await review.save();

    // Send notification for profile reviews
    if (reviewType === 'profile' && targetUser._id) {
      await notifyProfileReview(req.user.id, targetUser._id, rating, isAnonymous);
    }

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
    const { sort = 'date', page = 1, limit = 10 } = req.query;

    let sortOption = {};
    if (sort === 'rating') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ 
      reviewType: 'gig',
      gigId,
      status: 'active'
    })
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ 
      reviewType: 'gig',
      gigId,
      status: 'active'
    });

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { reviewType: 'gig', gigId, status: 'active' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.status(200).json({
      reviews,
      totalReviews,
      averageRating: avgRating.length > 0 ? avgRating[0].avgRating : 0,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching gig reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get reviews for a profile (freelancer or client)
export const getProfileReviews = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { sort = 'date', page = 1, limit = 10, role } = req.query;

    let sortOption = {};
    if (sort === 'rating') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { 
      reviewType: 'profile',
      targetId: profileId,
      status: 'active'
    };

    // Filter by role if specified
    if (role) {
      query.targetRole = role;
    }

    const reviews = await Review.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments(query);

    // Calculate average rating and breakdown
    const avgRating = await Review.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const ratingBreakdown = await Review.aggregate([
      { $match: query },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const breakdown = {
      5: ratingBreakdown.find(r => r._id === 5)?.count || 0,
      4: ratingBreakdown.find(r => r._id === 4)?.count || 0,
      3: ratingBreakdown.find(r => r._id === 3)?.count || 0,
      2: ratingBreakdown.find(r => r._id === 2)?.count || 0,
      1: ratingBreakdown.find(r => r._id === 1)?.count || 0
    };

    res.status(200).json({
      reviews,
      totalReviews,
      averageRating: avgRating.length > 0 ? avgRating[0].avgRating : 0,
      ratingBreakdown: breakdown,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching profile reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get reviews by a user (reviews they've written)
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ 
      reviewerId: userId,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ 
      reviewerId: userId,
      status: 'active'
    });

    res.status(200).json({
      reviews,
      totalReviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: error.message });
  }
};

// Mark review as helpful
export const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.email;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const helpfulUsers = review.helpfulUsers || [];
    const userIndex = helpfulUsers.indexOf(userId);

    if (userIndex > -1) {
      // User already marked as helpful, remove it
      helpfulUsers.splice(userIndex, 1);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // User hasn't marked as helpful, add it
      helpfulUsers.push(userId);
      review.helpfulCount = review.helpfulCount + 1;
    }

    review.helpfulUsers = helpfulUsers;
    await review.save();

    res.status(200).json({ 
      helpfulCount: review.helpfulCount,
      isHelpful: helpfulUsers.includes(userId)
    });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a review (only by the reviewer)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.email;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the reviewer
    if (review.reviewerId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    review.status = 'deleted';
    await review.save();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get review statistics for a user
export const getReviewStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Review.aggregate([
      { $match: { targetId: userId, status: 'active' } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingBreakdown: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.status(200).json({
        totalReviews: 0,
        averageRating: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const ratingBreakdown = stats[0].ratingBreakdown.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      totalReviews: stats[0].totalReviews,
      averageRating: stats[0].averageRating,
      ratingBreakdown
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: error.message });
  }
}; 
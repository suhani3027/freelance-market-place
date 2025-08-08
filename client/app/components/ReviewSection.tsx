"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Review {
  _id: string;
  reviewType: 'gig' | 'profile';
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'client' | 'freelancer';
  targetId: string;
  targetName: string;
  targetRole: 'client' | 'freelancer';
  rating: number;
  comment: string;
  title?: string;
  isAnonymous: boolean;
  helpfulCount: number;
  helpfulUsers: string[];
  gigTitle?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewSectionProps {
  type: 'gig' | 'profile';
  targetId: string;
  targetName: string;
  targetRole: 'client' | 'freelancer';
  gigId?: string;
  orderId?: string;
  profileId?: string;
  currentUserEmail?: string;
  currentUserRole?: string;
}

export default function ReviewSection({
  type,
  targetId,
  targetName,
  targetRole,
  gigId,
  orderId,
  profileId,
  currentUserEmail,
  currentUserRole
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const router = useRouter();

  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: '',
    isAnonymous: false
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadReviews();
    if (type === 'profile') {
      loadStats();
    }
  }, [type, targetId, gigId, currentPage, sortBy]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // For gig reviews, we need gigId
      if (type === 'gig' && !gigId) {
        console.error('gigId is required for gig reviews');
        return;
      }
      
      // For profile reviews, we need targetId
      if (type === 'profile' && !targetId) {
        console.error('targetId is required for profile reviews');
        return;
      }
      
      const endpoint = type === 'gig' 
        ? `/api/reviews/gig/${gigId}?page=${currentPage}&sort=${sortBy}`
        : `/api/reviews/profile/${targetId}?page=${currentPage}&sort=${sortBy}`;
      
      const response = await fetch(`${apiUrl}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || data);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('Failed to load reviews:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/reviews/stats/${targetId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserEmail) {
      alert('Please log in to leave a review');
      return;
    }

    if (!reviewData.comment.trim()) {
      alert('Please provide a comment');
      return;
    }

    // Validate required fields based on review type
    if (type === 'gig' && (!gigId || !targetId)) {
      alert('Missing required information for gig review');
      return;
    }

    if (type === 'profile' && (!targetId || !profileId)) {
      alert('Missing required information for profile review');
      return;
    }

    setSubmitting(true);
    try {
      const reviewPayload = {
        reviewType: type,
        targetId,
        rating: reviewData.rating,
        comment: reviewData.comment.trim(),
        title: reviewData.title.trim(),
        isAnonymous: reviewData.isAnonymous,
        ...(type === 'gig' && { gigId, ...(orderId && { orderId }) }),
        ...(type === 'profile' && { profileId })
      };

      const response = await fetch(`${apiUrl}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewPayload)
      });

      if (response.ok) {
        setReviewData({ rating: 5, title: '', comment: '', isAnonymous: false });
        setShowReviewForm(false);
        loadReviews();
        if (type === 'profile') {
          loadStats();
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/reviews/${reviewId}/helpful`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadReviews();
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const canLeaveReview = () => {
    if (!currentUserEmail) return false;
    if (currentUserEmail === targetId) return false;
    
    // For gig reviews, we need gigId and targetId (orderId is optional)
    if (type === 'gig' && (!gigId || !targetId)) return false;
    
    // For profile reviews, we need targetId and profileId
    if (type === 'profile' && (!targetId || !profileId)) return false;
    
    // Check if user has already reviewed
    const hasReviewed = reviews.some(review => review.reviewerId === currentUserEmail);
    return !hasReviewed;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {type === 'gig' ? 'Gig Reviews' : 'Profile Reviews'}
          </h3>
          {stats && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </span>
                {renderStars(Math.round(stats.averageRating || 0))}
              </div>
              <span className="text-gray-600">
                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}
        </div>
        
        {canLeaveReview() && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-4">Write a Review</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <svg
                      className={`w-6 h-6 ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {type === 'profile' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Title (Optional)
                </label>
                <input
                  type="text"
                  value={reviewData.title}
                  onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Summarize your experience"
                  maxLength={200}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Share your experience..."
                maxLength={1000}
                required
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={reviewData.isAnonymous}
                  onChange={(e) => setReviewData({ ...reviewData, isAnonymous: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Post anonymously</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {review.isAnonymous ? 'A' : review.reviewerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.isAnonymous ? 'Anonymous' : review.reviewerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {review.reviewerRole === 'client' ? 'Client' : 'Freelancer'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {renderStars(review.rating)}
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>

              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}

              <p className="text-gray-700 mb-3">{review.comment}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {review.helpfulCount > 0 && (
                    <span>{review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this helpful</span>
                  )}
                </div>
                
                <button
                  onClick={() => handleMarkHelpful(review._id)}
                  className="text-sm text-blue-600 hover:text-blue-700 transition"
                >
                  {review.helpfulUsers?.includes(currentUserEmail || '') ? 'Helpful' : 'Mark as helpful'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="date">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

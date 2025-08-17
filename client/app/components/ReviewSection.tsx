"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../lib/auth.js';
import ReviewForm from '../../components/ReviewForm';
import ReviewList from '../../components/ReviewList';
import StarRating from '../../components/StarRating';

interface Review {
  _id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  title?: string;
  createdAt: string;
  isAnonymous: boolean;
  helpfulCount: number;
  helpfulUsers: string[];
}

interface ReviewSectionProps {
  type: 'gig' | 'profile';
  targetId: string;
  targetName: string;
  targetRole: string;
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

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

  const handleSubmitReview = async (reviewData: { rating: number; comment: string; isAnonymous: boolean }) => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const requestBody: any = {
        reviewType: type,
        targetId: targetId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isAnonymous: reviewData.isAnonymous
      };

      // Add gig-specific fields if this is a gig review
      if (type === 'gig' && gigId) {
        requestBody.gigId = gigId;
        requestBody.title = `Review for ${targetName}`;
      }

      // Add profile-specific fields if this is a profile review
      if (type === 'profile') {
        requestBody.profileId = targetId;
        requestBody.title = `Review for ${targetName}`;
      }

      // Add orderId if available
      if (orderId) {
        requestBody.orderId = orderId;
      }

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        setSuccess('Review submitted successfully!');
        setShowReviewForm(false);
        // Refresh reviews
        loadReviews();
        // Refresh stats if this is a profile review
        if (type === 'profile') {
          loadStats();
        }
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewHelpful = async (reviewId: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh reviews to show updated helpful count
        loadReviews();
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const canWriteReview = () => {
    if (!currentUserEmail) return false;
    if (currentUserEmail === targetId) return false; // Can't review yourself
    return true;
  };

  const hasUserReviewed = () => {
    if (!currentUserEmail) return false;
    return reviews.some(review => review.reviewerName === getUser()?.name || review.reviewerName === 'Anonymous');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
            {stats && (
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center">
                  <StarRating rating={stats.averageRating || 0} size="sm" />
                  <span className="ml-2 text-sm text-gray-600">
                    {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'} out of 5
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {stats.totalReviews || reviews.length} reviews
                </span>
              </div>
            )}
          </div>
          
          {canWriteReview() && !hasUserReviewed() && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="p-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.118 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              {canWriteReview() && !hasUserReviewed() 
                ? 'Be the first to review this ' + (type === 'gig' ? 'gig' : 'profile') + '!'
                : 'No reviews have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {review.isAnonymous ? 'A' : review.reviewerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {review.isAnonymous ? 'Anonymous' : review.reviewerName}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleReviewHelpful(review._id)}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>{review.helpfulCount || 0}</span>
                  </button>
                </div>
                
                {review.title && (
                  <h4 className="text-sm font-medium text-gray-900 mt-3">{review.title}</h4>
                )}
                
                <p className="text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          orderId={orderId}
          gigTitle={targetName}
          onSubmit={handleSubmitReview}
          onCancel={() => setShowReviewForm(false)}
          isLoading={submitting}
        />
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

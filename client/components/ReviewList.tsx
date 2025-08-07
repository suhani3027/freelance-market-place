"use client";
import { useState } from 'react';
import StarRating from './StarRating';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  clientName: string;
  createdAt: string;
  helpfulCount: number;
  isAnonymous: boolean;
  gigTitle: string;
}

interface ReviewListProps {
  reviews: Review[];
  onMarkHelpful?: (reviewId: string) => void;
  showGigTitle?: boolean;
  sortBy?: 'date' | 'rating';
  onSortChange?: (sort: 'date' | 'rating') => void;
}

export default function ReviewList({ 
  reviews, 
  onMarkHelpful, 
  showGigTitle = false,
  sortBy = 'date',
  onSortChange 
}: ReviewListProps) {
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  const handleMarkHelpful = (reviewId: string) => {
    if (helpfulReviews.has(reviewId)) return;
    
    setHelpfulReviews(prev => new Set(prev).add(reviewId));
    if (onMarkHelpful) {
      onMarkHelpful(reviewId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
        <p className="text-gray-500">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Options */}
      {onSortChange && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'date' | 'rating')}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Date</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StarRating rating={review.rating} readonly size="sm" />
                  <span className="text-sm text-gray-500">
                    by {review.isAnonymous ? 'Anonymous' : review.clientName}
                  </span>
                </div>
                
                {showGigTitle && (
                  <p className="text-sm text-gray-600 mb-2">
                    For: {review.gigTitle}
                  </p>
                )}
                
                <p className="text-gray-700 leading-relaxed mb-3">
                  {review.comment}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {formatDate(review.createdAt)}
                  </span>
                  
                  {onMarkHelpful && (
                    <button
                      onClick={() => handleMarkHelpful(review._id)}
                      disabled={helpfulReviews.has(review._id)}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                        helpfulReviews.has(review._id)
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Helpful ({review.helpfulCount + (helpfulReviews.has(review._id) ? 1 : 0)})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
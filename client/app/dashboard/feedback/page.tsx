'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../../lib/auth.js';
import StarRating from '../../../components/StarRating';
import ReviewList from '../../../components/ReviewList';

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

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function FeedbackPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const token = getToken();
      const userData = getUser();
      
      if (!token || !userData || !isValidTokenFormat(token)) {
        console.log('No valid token or user data found, redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      }
      
      setUser(userData);
      loadReviews(userData.email);
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuthData();
      router.push('/login');
    }
  };

  const loadReviews = async (userEmail: string) => {
    setLoading(true);
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for loading reviews');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reviews/profile/${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setStats(data.stats);
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to load reviews:', response.status);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for marking review helpful');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh reviews to show updated helpful count
        if (user?.email) {
          loadReviews(user.email);
        }
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to mark review helpful:', response.status);
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Feedback</h1>
          <p className="text-gray-600">See what clients are saying about your work</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  <StarRating rating={Math.round(stats.averageRating)} readonly size="lg" />
                </div>
                <p className="text-sm text-gray-600">
                  {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Rating Breakdown */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
                    const percentage = stats.totalReviews > 0 
                      ? (count / stats.totalReviews) * 100 
                      : 0;
                    
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-16">
                          <span className="text-sm font-medium text-gray-700">{rating}★</span>
                          <span className="text-xs text-gray-500">({count})</span>
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-12 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Reviews</h2>
            <div className="text-sm text-gray-600">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          
          <ReviewList
            reviews={reviews}
            onMarkHelpful={handleMarkHelpful}
            showGigTitle={true}
          />
        </div>
      </div>
    </div>
  );
} 
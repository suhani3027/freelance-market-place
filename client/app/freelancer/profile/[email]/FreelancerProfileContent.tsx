"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL, makeApiCall } from '../../../../lib/api';
import ConnectionButton from '../../../components/ConnectionButton';
import MessageButton from '../../../components/MessageButton';
import ReviewForm from '../../../../components/ReviewForm';
import { getToken, isValidTokenFormat, clearAuthData } from '../../../../lib/auth';
import { useRouter } from 'next/navigation';

interface FreelancerProfileContentProps {
  email: string;
}

export default function FreelancerProfileContent({ email }: FreelancerProfileContentProps) {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if this is the current user's own profile
        const currentUserEmail = localStorage.getItem('email');
        setIsOwnProfile(currentUserEmail === email);

        const profileRes = await fetch(`${API_BASE_URL}/api/freelancer-profile/${encodeURIComponent(email)}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else {
          setError('Failed to load profile');
        }

        const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/freelancer/${encodeURIComponent(email)}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, isOwnProfile]);

  const handleReviewSubmit = async (reviewData: { rating: number; comment: string; isAnonymous: boolean }) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewType: 'profile',
          targetId: email,
          profileId: email,
          rating: reviewData.rating,
          comment: reviewData.comment,
          isAnonymous: reviewData.isAnonymous,
          title: `Review for ${profile.fullName || profile.name || email}`
        })
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        // Refresh profile to show new review
        // Re-fetch the profile data
        const profileRes = await fetch(`${API_BASE_URL}/api/freelancer-profile/${encodeURIComponent(email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        const errorData = await response.json();
        alert(`Failed to submit review: ${errorData.message || errorData.error}`);
      }
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={profile.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.fullName || profile.name}</h1>
            <p className="text-gray-600">{profile.email}</p>
            {profile.title && (
              <p className="text-gray-500">{profile.title}</p>
            )}
          </div>
          <div className="flex gap-2">
            {/* Show different buttons based on whether it's own profile or not */}
            {isOwnProfile ? (
              // Own profile - show edit profile button
              <a
                href="/freelancer/profile/edit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </a>
            ) : (
                             // Other profile - show connect button and message button only if connected
               <>
                 <ConnectionButton targetEmail={email} />
                                   <MessageButton recipientEmail={email} />
                
                {/* Review Button - Only show for clients */}
                {localStorage.getItem('role') === 'client' && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Leave Review
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Profile Details */}
        {profile.overview && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Overview</h2>
            <p className="text-gray-700">{profile.overview}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Reviews</h2>
          {profile.reviews && profile.reviews.length > 0 ? (
            <div className="space-y-4">
              {profile.reviews.map((review: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < review.rating ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {review.rating}/5
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  {review.isAnonymous ? (
                    <p className="text-sm text-gray-500 mt-2">- Anonymous</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">- {review.reviewerName}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </div>

        {/* Other profile details */}
        {profile.hourlyRate && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Hourly Rate</h3>
            <p className="text-gray-700">${profile.hourlyRate}/hour</p>
          </div>
        )}

        {profile.experienceLevel && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Experience Level</h3>
            <p className="text-gray-700">{profile.experienceLevel}</p>
          </div>
        )}

        {profile.location && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Location</h3>
            <p className="text-gray-700">{profile.location}</p>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <ReviewForm
          orderId=""
          gigTitle={`Review for ${profile.fullName || profile.name}`}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}

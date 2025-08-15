'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

interface Gig {
  _id: string;
  title: string;
  description: string;
  amount: number;
  technology: string;
  duration: string;
  clientId: string;
  createdAt?: string;
  skills?: string[];
  clientEmail?: string;
  image?: string;
}

interface ClientInfo {
  name: string;
  email: string;
  profilePhoto?: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  reviewerEmail: string;
  createdAt: string;
}

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [gig, setGig] = useState<Gig | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalSuccess, setProposalSuccess] = useState('');
  const [proposalError, setProposalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchGigDetails(params.id as string);
      fetchUserData();
      fetchReviews(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (user) {
      checkProfileCompletion();
    }
  }, [user]);

  const checkProfileCompletion = async () => {
    if (!user || user.role !== 'freelancer') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/freelancer-profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const profile = await response.json();
        // Check if profile has essential fields
        const hasEssentialFields = profile.fullName && profile.title && profile.skills && profile.skills.length > 0;
        setHasCompleteProfile(hasEssentialFields);
      }
    } catch (error) {
      console.error('Failed to check profile completion:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      
      if (!email || !token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchGigDetails = async (gigId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gigs/${gigId}`);
      if (response.ok) {
        const gigData = await response.json();
        setGig(gigData);
        
        // Fetch client info
        if (gigData.clientId) {
          const clientResponse = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(gigData.clientId)}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setClientInfo(clientData);
          }
        }
      } else {
        setError('Failed to fetch gig details');
      }
    } catch (error) {
      setError('Failed to fetch gig details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (gigId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/gig/${gigId}`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    }
  };

  const handleApply = async () => {
    if (!gig || !user) return;
    
    setSubmitting(true);
    setProposalSuccess('');
    setProposalError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gigId: gig._id,
          proposal: coverLetter,
          bidAmount: Number(proposalAmount),
          estimatedDuration: gig.duration || 'Flexible'
        }),
      });

      if (response.ok) {
        setProposalSuccess('Proposal submitted successfully!');
        setTimeout(() => {
          setShowApplyModal(false);
          setCoverLetter('');
          setProposalAmount('');
        }, 2000);
      } else {
        const data = await response.json();
        let errorMessage = data.message || 'Failed to submit proposal';
        
        // Provide more helpful error messages
        if (data.error) {
          if (data.error.includes('profile')) {
            errorMessage = 'Please complete your freelancer profile before submitting proposals. Go to your profile page to add your skills and experience.';
          } else if (data.error.includes('already submitted')) {
            errorMessage = 'You have already submitted a proposal for this gig.';
          } else if (data.error.includes('Missing required fields')) {
            errorMessage = 'Please fill in all required fields: cover letter (minimum 50 characters) and proposed amount.';
          } else {
            errorMessage = data.error;
          }
        }
        
        setProposalError(errorMessage);
      }
    } catch (error) {
      setProposalError('Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!gig || !user) return;
    
    setSubmittingReview(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewType: 'gig',
          targetId: gig.clientId, // The client who created the gig
          gigId: gig._id,
          rating: reviewRating,
          comment: reviewComment,
          title: `Review for ${gig.title}`
        }),
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment('');
        fetchReviews(gig._id);
      } else {
        const data = await response.json();
        let errorMessage = data.message || 'Failed to submit review';
        
        // Provide more helpful error messages
        if (data.message) {
          if (data.message.includes('already reviewed')) {
            errorMessage = 'You have already reviewed this gig. You can submit another review if needed.';
          } else if (data.message.includes('Missing required fields')) {
            errorMessage = 'Please fill in all required fields: rating and comment.';
          } else {
            errorMessage = data.message;
          }
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getClientInitial = () => {
    if (clientInfo?.name) {
      return clientInfo.name.charAt(0).toUpperCase();
    }
    if (clientInfo?.email) {
      return clientInfo.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getClientAvatarColor = () => {
    const initial = getClientInitial();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
    return colors[Math.abs(initial.charCodeAt(0)) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Gig not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Gigs
        </button>

        {/* Gig Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{gig.title}</h1>
              
              {/* Client Info */}
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${getClientAvatarColor()}`}>
                  {clientInfo?.profilePhoto ? (
                    <img 
                      src={clientInfo.profilePhoto} 
                      alt="Client" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-white">{getClientInitial()}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{clientInfo?.name || 'Anonymous Client'}</p>
                  <p className="text-sm text-gray-600">Posted {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString() : 'recently'}</p>
                </div>
              </div>

              {/* Gig Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="text-2xl font-bold text-green-600">${gig.amount}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{gig.duration || 'Flexible'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Technology</p>
                  <p className="text-lg font-semibold text-gray-900">{gig.technology || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {user && user.role === 'freelancer' && user.email !== gig.clientId && (
            <div className="flex gap-4">
              {!hasCompleteProfile ? (
                <div className="flex-1">
                  <button
                    disabled
                    className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed font-medium"
                  >
                    Complete Profile First
                  </button>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Please complete your profile with skills and experience before applying
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Now
                </button>
              )}
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Write Review
              </button>
            </div>
          )}
        </div>

        {/* Gig Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{gig.description}</p>
          </div>

          {/* Skills */}
          {gig.skills && gig.skills.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {gig.skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
            <span className="text-sm text-gray-600">{reviews.length} reviews</span>
          </div>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this gig!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="font-medium text-gray-900">{review.reviewerName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" 
              onClick={() => setShowApplyModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Submit Proposal</h2>
            
            <div className="mb-4">
              <label className="block font-medium mb-1">Cover Letter</label>
              <textarea
                className="border rounded w-full p-2 min-h-[100px]"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you're the best fit for this project..."
                required
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1">Proposed Amount ($)</label>
              <input
                className="border rounded w-full p-2"
                type="number"
                value={proposalAmount}
                onChange={(e) => setProposalAmount(e.target.value)}
                placeholder="Enter your proposed amount"
                required
              />
            </div>

            <button
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={submitting || !coverLetter || !proposalAmount}
              onClick={handleApply}
            >
              {submitting ? 'Submitting...' : 'Submit Proposal'}
            </button>

            {proposalError && <div className="text-red-500 mt-2">{proposalError}</div>}
            {proposalSuccess && <div className="text-green-600 mt-2">{proposalSuccess}</div>}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" 
              onClick={() => setShowReviewModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Write a Review</h2>
            
            <div className="mb-4">
              <label className="block font-medium mb-1">Rating</label>
              <div className="flex text-2xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`mr-1 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1">Comment</label>
              <textarea
                className="border rounded w-full p-2 min-h-[100px]"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this gig..."
                required
              />
            </div>

            <button
              className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={submittingReview || !reviewComment}
              onClick={handleSubmitReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
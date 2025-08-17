'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../../lib/auth.js';
import Link from 'next/link';
import ReviewSection from '../../components/ReviewSection';

interface Gig {
  _id: string;
  title: string;
  description: string;
  amount: number;
  duration: string;
  technology: string;
  skills: string[];
  clientId: string;
  createdAt: string;
}

interface ClientInfo {
  name: string;
  email: string;
  profilePhoto?: string;
}

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [gig, setGig] = useState<Gig | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalSuccess, setProposalSuccess] = useState('');
  const [proposalError, setProposalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      fetchGigDetails();
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuthData();
      router.push('/login');
    }
  };

  const fetchGigDetails = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching gig details');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const gigData = await response.json();
        setGig(gigData);
        
        // Fetch client info
        if (gigData.clientId) {
          const clientResponse = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(gigData.clientId)}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setClientInfo(clientData);
          }
        }
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch gig details:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch gig details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!gig || !user) return;
    
    setSubmitting(true);
    setProposalSuccess('');
    setProposalError('');
    
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        setProposalError('Authentication required. Please log in again.');
        return;
      }
      
      // Validate form data before submission
      if (!coverLetter || coverLetter.trim().length < 50) {
        setProposalError('Cover letter must be at least 50 characters long.');
        return;
      }
      
      if (!proposalAmount || Number(proposalAmount) <= 0) {
        setProposalError('Please enter a valid proposal amount.');
        return;
      }
      
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
        let errorMessage = 'Failed to submit proposal';
        
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
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.details) {
          errorMessage = data.details;
        }
        
        console.error('Proposal submission failed:', data);
        setProposalError(errorMessage);
      }
    } catch (error) {
      console.error('Proposal submission error:', error);
      setProposalError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
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
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Now
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
        <ReviewSection
          type="gig"
          targetId={gig.clientId}
          targetName={clientInfo?.name || gig.clientId || 'Anonymous Client'}
          targetRole="client"
          gigId={gig._id}
          currentUserEmail={user?.email}
          currentUserRole={user?.role}
        />
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
    </div>
  );
} 
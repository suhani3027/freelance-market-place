'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../../lib/auth.js';

export default function FreelancerProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [completingGigId, setCompletingGigId] = useState(null);

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
      
      // Check if user is a freelancer
      if (userData.role !== 'freelancer') {
        alert('Only freelancers can view their proposals');
        router.push('/dashboard');
        return;
      }
      
      setUser(userData);
      fetchProposals();
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuthData();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching proposals');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/proposals/freelancer/accepted`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch proposals:', response.status);
        setError('Failed to load proposals');
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
      setError('Failed to load proposals');
    }
  };

  const withdrawProposal = async (proposalId) => {
    if (!confirm('Are you sure you want to withdraw this proposal?')) return;

    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for withdrawing proposal');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/withdraw`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setProposals(prev => 
          prev.map(proposal => 
            proposal._id === proposalId 
              ? { ...proposal, status: 'withdrawn' }
              : proposal
          )
        );
        alert('Proposal withdrawn successfully!');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to withdraw proposal');
      }
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      alert('Failed to withdraw proposal');
    }
  };

  const markAsComplete = async (proposalId) => {
    if (!confirm('Are you sure you want to mark this gig as complete?')) return;

    setCompletingGigId(proposalId);

    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for marking complete');
        return;
      }

      // Find the proposal to get the gigId
      const proposal = proposals.find(p => p._id === proposalId);
      if (!proposal || !proposal.gigId) {
        alert('Proposal or gig information not found');
        return;
      }

      // Get the gig ID - the gigId should be a populated object with _id
      let gigId;
      if (typeof proposal.gigId === 'object' && proposal.gigId._id) {
        // If it's a populated gig object, get the _id
        gigId = proposal.gigId._id;
      } else if (typeof proposal.gigId === 'object') {
        // If it's an ObjectId object, convert to string
        gigId = proposal.gigId.toString();
      } else if (typeof proposal.gigId === 'string') {
        // If it's already a string, use it as is
        gigId = proposal.gigId;
      } else {
        console.error('Unexpected gigId format:', proposal.gigId);
        alert('Invalid gig data format');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/${gigId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setProposals(prev => 
          prev.map(proposal => 
            proposal._id === proposalId 
              ? { ...proposal, status: 'completed', completedAt: new Date().toISOString() }
              : proposal
          )
        );
        alert('Gig marked as complete successfully!');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to mark gig as complete');
      }
    } catch (error) {
      console.error('Error marking gig as complete:', error);
      alert('Failed to mark gig as complete');
    } finally {
      setCompletingGigId(null);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Ongoing Gigs</h1>
          <p className="text-gray-600">Manage your accepted gigs and mark them as complete when finished</p>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ongoing gigs</h3>
            <p className="text-gray-600 mb-6">You don&apos;t have any accepted gigs yet. Browse available gigs and submit proposals!</p>
            <button
              onClick={() => router.push('/explore')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Gigs
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((gig) => (
              <div key={gig._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {gig.gigId?.title || 'Project'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>Client: {gig.clientId}</span>
                      <span>Amount: ${gig.bidAmount}</span>
                      <span>Duration: {gig.estimatedDuration}</span>
                      <span>Accepted: {new Date(gig.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(gig.status)}`}>
                        {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                      </span>
                      {gig.completedAt && (
                        <span className="text-xs text-gray-500">
                          Completed: {new Date(gig.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Freelancer can mark gig as complete */}
                  {gig.status === 'accepted' && (
                    <button
                      onClick={() => markAsComplete(gig._id)}
                      disabled={completingGigId === gig._id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {completingGigId === gig._id ? 'Marking Complete...' : 'Mark Complete'}
                    </button>
                  )}
                  
                  {gig.status === 'completed' && (
                    <div className="px-4 py-2 bg-green-600 text-white rounded-lg">
                      <span className="font-medium">✓ Completed</span>
                    </div>
                  )}
                  
                  {gig.status === 'paid' && (
                    <div className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                      <span className="font-medium">✓ Paid</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Your Proposal</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{gig.proposal}</p>
                </div>

                {gig.gigId && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                    <p className="text-gray-700 text-sm">{gig.gigId.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

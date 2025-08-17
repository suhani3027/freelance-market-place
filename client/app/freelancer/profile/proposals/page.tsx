'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../../../lib/auth.js';

interface Proposal {
  _id: string;
  gigId: string;
  clientId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  proposal: string;
  bidAmount: number;
  estimatedDuration: string;
  submittedAt: string;
  completedAt?: string;
  freelancerProfile: {
    name: string;
    title: string;
    overview: string;
    skills: string[];
    hourlyRate: number;
    experienceLevel: string;
    location: string;
    profilePhoto: string;
  };
  gig?: {
    title: string;
    description: string;
    amount: number;
  };
}

export default function FreelancerProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingProposal, setCompletingProposal] = useState<string | null>(null);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching proposals');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/proposals/freelancer`, {
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
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (proposalId: string) => {
    setCompletingProposal(proposalId);
    try {
      const response = await fetch(`${apiUrl}/api/proposals/${proposalId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Proposal marked as completed! Client can now make payment of $${result.amount}`);
        fetchProposals(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error marking proposal as completed:', error);
      alert('Error marking proposal as completed');
    } finally {
      setCompletingProposal(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Proposals</h1>
          <p className="text-gray-600">Track your submitted proposals and manage completed projects</p>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-6">Start by browsing gigs and submitting proposals</p>
            <button
              onClick={() => router.push('/gigs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Gigs
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {proposal.gig?.title || 'Project Proposal'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>Client: {proposal.clientId}</span>
                      <span>Bid: ${proposal.bidAmount}</span>
                      <span>Duration: {proposal.estimatedDuration}</span>
                      <span>Submitted: {new Date(proposal.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                      {proposal.completedAt && (
                        <span className="text-xs text-gray-500">
                          Completed: {new Date(proposal.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {proposal.status === 'accepted' && (
                    <button
                      onClick={() => markAsCompleted(proposal._id)}
                      disabled={completingProposal === proposal._id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {completingProposal === proposal._id ? 'Marking...' : 'Mark as Completed'}
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Proposal Details</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{proposal.proposal}</p>
                </div>

                {proposal.gig && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                    <p className="text-gray-700 text-sm">{proposal.gig.description}</p>
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
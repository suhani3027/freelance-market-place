'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Proposal {
  _id: string;
  gigId: string;
  clientId: string;
  freelancerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'paid';
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
  orderId?: string;
}

export default function FreelancerOngoingGigs() {
  const [ongoingGigs, setOngoingGigs] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingGigId, setCompletingGigId] = useState<string | null>(null);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchOngoingGigs();
  }, []);

  const fetchOngoingGigs = async () => {
    try {
      // Fetch only accepted proposals (ongoing gigs)
      const response = await fetch(`${apiUrl}/api/proposals/freelancer/accepted`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOngoingGigs(data);
      }
    } catch (error) {
      console.error('Error fetching ongoing gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async (proposalId: string) => {
    setCompletingGigId(proposalId);
    try {
      const response = await fetch(`${apiUrl}/api/proposals/${proposalId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to mark as complete');
      }
      await fetchOngoingGigs();
      alert('Gig marked as complete! Client will now see the payment option.');
    } catch (e) {
      alert((e as Error).message);
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

        {ongoingGigs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ongoing gigs</h3>
            <p className="text-gray-600 mb-6">You don't have any accepted gigs yet. Browse available gigs and submit proposals!</p>
            <button
              onClick={() => router.push('/explore')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Gigs
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {ongoingGigs.map((gig) => (
              <div key={gig._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {gig.gig?.title || 'Project'}
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

                {gig.gig && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Project Details</h4>
                    <p className="text-gray-700 text-sm">{gig.gig.description}</p>
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

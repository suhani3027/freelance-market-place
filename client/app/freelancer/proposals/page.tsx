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

export default function ClientProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchProposals();
    
    // Check if we need to refresh after payment
    const shouldRefresh = sessionStorage.getItem('refreshProposals');
    if (shouldRefresh === 'true') {
      sessionStorage.removeItem('refreshProposals');
      // Small delay to ensure backend has updated
      setTimeout(() => {
        fetchProposals();
      }, 1000);
    }
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/proposals/client`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (proposal: Proposal) => {
    setProcessingPayment(proposal._id);
    try {
      // Prepare payment data
      const paymentData = {
        gigId: proposal.gigId, // gigId is already a string
        clientId: proposal.clientId,
        amount: Number(proposal.bidAmount), // Ensure it's a number
        gigTitle: proposal.gig?.title || 'Completed Project'
      };



      // Create checkout session using the new simplified endpoint
      const response = await fetch(`${apiUrl}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Check if we have a URL
        if (!result.url) {
          throw new Error('Payment session could not be created');
        }
        
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        console.error('Payment error response:', error);
        alert(`Error: ${error.error || 'Failed to process payment'}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again or contact support.');
    } finally {
      setProcessingPayment(null);
    }
  };

  // Refresh proposals to get updated status
  const refreshProposals = async () => {
    await fetchProposals();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposals</h1>
          <p className="text-gray-600">Review and manage proposals for your gigs</p>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-6">Proposals will appear here when freelancers submit them</p>
            <button
              onClick={() => router.push('/my-gigs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View My Gigs
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
                      <span>Freelancer: {proposal.freelancerProfile?.name || proposal.freelancerId}</span>
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
                  
                  {proposal.status === 'completed' && (
                    <button
                      onClick={() => handlePayment(proposal)}
                      disabled={processingPayment === proposal._id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {processingPayment === proposal._id ? 'Processing...' : `Pay $${proposal.bidAmount}`}
                    </button>
                  )}
                  
                  {proposal.status === 'paid' && (
                    <div className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                      <span className="font-medium">✓ Paid</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Proposal Details</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{proposal.proposal}</p>
                </div>

                {proposal.freelancerProfile && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Freelancer Profile</h4>
                    <div className="text-sm text-gray-700">
                      <p><strong>Name:</strong> {proposal.freelancerProfile.name}</p>
                      <p><strong>Title:</strong> {proposal.freelancerProfile.title}</p>
                      <p><strong>Experience:</strong> {proposal.freelancerProfile.experienceLevel}</p>
                      <p><strong>Skills:</strong> {proposal.freelancerProfile.skills.join(', ')}</p>
                    </div>
                  </div>
                )}

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

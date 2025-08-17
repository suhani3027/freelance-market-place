"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../../lib/auth.js';

interface Proposal {
  _id: string;
  gigId: {
    _id: string;
    title: string;
    description: string;
    amount: number;
  };
  freelancerId: string;
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
  proposal: string;
  bidAmount: number;
  estimatedDuration: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'paid';
  submittedAt: string;
  orderId?: string;
}

export default function ClientProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');

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
      
      // Check if user is a client
      if (userData.role !== 'client') {
        alert('Only clients can view proposals');
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

      const response = await fetch(`${API_BASE_URL}/api/proposals/client`, {
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

  const acceptProposal = async (proposalId: string) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for accepting proposal');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/accept`, {
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
              ? { ...proposal, status: 'accepted' }
              : proposal
          )
        );
        alert('Proposal accepted successfully!');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to accept proposal');
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert('Failed to accept proposal');
    }
  };

  const rejectProposal = async (proposalId: string) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for rejecting proposal');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/proposals/${proposalId}/reject`, {
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
              ? { ...proposal, status: 'rejected' }
              : proposal
          )
        );
        alert('Proposal rejected successfully!');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to reject proposal');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert('Failed to reject proposal');
    }
  };

  const handlePayment = async (proposalId: string) => {
    try {
      const proposal = proposals.find(p => p._id === proposalId);
      if (!proposal) {
        alert('Proposal not found');
        return;
      }

              // Processing payment for proposal

      // Prepare payment data
      const paymentData = {
        gigId: proposal.gigId?._id || proposal.gigId,
        clientId: user?.email || getUser()?.email, // Use current user's email as clientId
        amount: Number(proposal.bidAmount),
        gigTitle: proposal.gigId?.title || 'Completed Project',
        proposalId: proposalId
      };

              // Payment data prepared

      const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (!result.url) {
          throw new Error('Payment session could not be created');
        }
        
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        alert(`Error: ${error.error || 'Failed to process payment'}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment. Please try again or contact support.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading proposals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'client' ? 'Received Proposals' : 'My Proposals'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'client' 
              ? 'Review and manage proposals from freelancers' 
              : 'Track the status of your submitted proposals'
            }
          </p>
        </div>

        {proposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {user?.role === 'client' ? 'No proposals yet' : 'No proposals submitted'}
            </h3>
            <p className="text-gray-600">
              {user?.role === 'client' 
                ? 'When freelancers submit proposals for your gigs, they\'ll appear here.'
                : 'You haven\'t submitted any proposals yet. Browse available gigs and submit proposals!'
              }
            </p>
            {user?.role === 'freelancer' && (
              <button
                onClick={() => window.location.href = '/explore'}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Gigs
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {proposal.gigId?.title || 'Gig Title Not Available'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>Budget: ${proposal.gigId?.amount || 'N/A'}</span>
                      <span>Bid: ${proposal.bidAmount}</span>
                      <span>Duration: {proposal.estimatedDuration}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      proposal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Profile Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    {user?.role === 'client' ? (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-3">Freelancer Profile</h4>
                        <div className="flex items-center space-x-3 mb-3">
                          {proposal.freelancerProfile?.profilePhoto ? (
                            <img 
                              src={proposal.freelancerProfile.profilePhoto} 
                              alt={proposal.freelancerProfile.name || 'Freelancer'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {(proposal.freelancerProfile?.name || 'F').charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900">{proposal.freelancerProfile?.name || 'Freelancer'}</h4>
                            <p className="text-sm text-gray-600">{proposal.freelancerProfile?.title || 'No title'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{proposal.freelancerProfile?.overview || 'No overview available'}</p>
                        <div className="flex flex-wrap gap-2">
                          {proposal.freelancerProfile?.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          )) || <span className="text-gray-500 text-xs">No skills listed</span>}
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Experience:</span> {proposal.freelancerProfile?.experienceLevel || 'Not specified'}
                          {proposal.freelancerProfile?.hourlyRate && (
                            <span className="ml-4">
                              <span className="font-medium">Rate:</span> ${proposal.freelancerProfile.hourlyRate}/hr
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-3">Gig Details</h4>
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900">{proposal.gigId?.title || 'Gig Title Not Available'}</h5>
                          <p className="text-sm text-gray-600">Budget: ${proposal.gigId?.amount || 'N/A'}</p>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{proposal.gigId?.description || 'No description available'}</p>
                      </>
                    )}
                  </div>

                  {/* Proposal Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {user?.role === 'client' ? 'Proposal Message' : 'Your Proposal'}
                    </h4>
                    <p className="text-gray-700 mb-4">{proposal.proposal}</p>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Submitted: {new Date(proposal.submittedAt).toLocaleDateString()}</p>
                      {user?.role === 'client' && (
                        <p>Bid Amount: ${proposal.bidAmount}</p>
                      )}
                    </div>

                                         {/* Action Buttons - Only for Clients */}
                     {user?.role === 'client' && (
                       <div className="space-y-2">
                         {proposal.status === 'pending' && (
                           <div className="flex space-x-2">
                             <button
                               onClick={() => acceptProposal(proposal._id)}
                               className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                             >
                               Accept Proposal
                             </button>
                             <button
                               onClick={() => rejectProposal(proposal._id)}
                               className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                             >
                               Reject Proposal
                             </button>
                           </div>
                         )}
                         
                         {proposal.status === 'completed' && (
                           <div className="space-y-2">
                             <button
                               onClick={() => handlePayment(proposal._id)}
                               className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                             >
                               Pay ${proposal.bidAmount}
                             </button>
                             {proposal.orderId && (
                               <div className="text-xs text-gray-500 text-center">
                                 Order ID: {proposal.orderId}
                               </div>
                             )}
                           </div>
                         )}
                         
                         {proposal.status === 'paid' && (
                           <div className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-center text-sm font-medium">
                             ✓ Payment Completed
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Status Display for Freelancers */}
                     {user?.role === 'freelancer' && (
                       <div className="space-y-2">
                         <div className={`w-full px-4 py-2 rounded-lg text-center text-sm font-medium ${
                           proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                           proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                           proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                           proposal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                           proposal.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           Status: {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

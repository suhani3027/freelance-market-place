"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProposalForm from "../../../components/ProposalForm";
import ReviewList from "../../../components/ReviewList";

interface Gig {
  _id: string;
  title: string;
  technology?: string;
  duration?: string;
  amount?: number;
  description: string;
  clientId?: string;
  createdAt?: string;
  skills?: string[];
  clientInfo?: {
    name: string;
    email: string;
  };
}



export default function GigDetailPage() {
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const gigId = params.id as string;

  useEffect(() => {
    if (gigId) {
      fetchGigDetails();
    }
    // Get current user info
    const userEmail = localStorage.getItem('email');
    const userRole = localStorage.getItem('role');
    if (userEmail) {
      setCurrentUserEmail(userEmail);
      setCurrentUserRole(userRole || '');
    }
    
    // Load reviews and proposals
    if (gigId) {
      loadReviews();
      loadProposals(); // Load proposals for all users to see if any exist
    }
  }, [gigId]);

  const fetchGigDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/gigs/${gigId}`);
      if (response.ok) {
        const gigData = await response.json();
        setGig(gigData);
        
        // Fetch client info if available
        if (gigData.clientId) {
          try {
            const clientResponse = await fetch(`http://localhost:5000/api/user/${encodeURIComponent(gigData.clientId)}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              setClientInfo(clientData);
            }
          } catch (error) {
            console.error("Error fetching client info:", error);
          }
        }
      } else {
        console.error("Gig not found");
        router.push("/gigs");
      }
    } catch (error) {
      console.error("Error fetching gig:", error);
      router.push("/gigs");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/gigs/edit/${gigId}`);
  };

  const handleBack = () => {
    router.back();
  };



  const handleProposalSubmit = async (proposalData: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(proposalData)
      });

      if (response.ok) {
        setShowProposalForm(false);
        alert('Proposal submitted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Error submitting proposal. Please try again.');
    }
  };

  const loadProposals = async () => {
    setProposalsLoading(true);
    try {
      console.log('Loading proposals for gig:', gigId);
      
      // Try the authenticated route first
      let response = await fetch(`http://localhost:5000/api/proposals/gig/${gigId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // If 403 (not authorized), try the public route for debugging
      if (response.status === 403) {
        console.log('Not authorized, trying public route...');
        response = await fetch(`http://localhost:5000/api/proposals/gig/${gigId}/public`);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Proposals loaded:', data);
        setProposals(data);
      } else {
        console.error('Failed to load proposals:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleProposalStatusUpdate = async (proposalId: string, status: string, feedback?: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/proposals/${proposalId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, feedback })
      });

      if (response.ok) {
        loadProposals(); // Refresh proposals
        alert(`Proposal ${status}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
      alert('Error updating proposal status. Please try again.');
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/gig/${gigId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await fetch(`http://localhost:5000/api/reviews/${reviewId}/helpful`, {
        method: 'PUT'
      });
      // Optionally refresh reviews to show updated helpful count
      loadReviews();
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading gig details...</div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gig not found</h1>
          <Link href="/gigs">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Back to Gigs
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Gig Details</h1>
            </div>
            <div className="flex gap-3">
              {currentUserEmail === gig.clientId && (
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Gig
                </button>
              )}
              <Link href="/gigs">
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                  Back to Gigs
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Gig Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">{gig.title}</h1>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">${gig.amount || 0}</div>
              <div className="text-lg opacity-90">{gig.duration}</div>
            </div>
          </div>

          {/* Gig Content */}
          <div className="p-8">
            {/* Posted by Info */}
            {clientInfo && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Posted by</h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {clientInfo.name ? clientInfo.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{clientInfo.name || 'Unknown User'}</div>
                    <div className="text-sm text-gray-600">{clientInfo.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {gig.description}
              </div>
            </div>

            {/* Skills */}
            {gig.skills && gig.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Skills Required</h3>
                <div className="flex flex-wrap gap-2">
                  {gig.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technology */}
            {gig.technology && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Technology</h3>
                <div className="text-gray-700">{gig.technology}</div>
              </div>
            )}

                         {/* Proposal Section */}
             <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
               <h3 className="font-semibold text-gray-900 mb-4">Proposal System</h3>
               
               {/* Debug Info */}
               <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-sm">
                 <p><strong>Debug Info:</strong></p>
                 <p>Current User: {currentUserEmail}</p>
                 <p>User Role: {currentUserRole}</p>
                 <p>Gig Owner: {gig.clientId}</p>
                 <p>Is Owner: {currentUserEmail === gig.clientId ? 'Yes' : 'No'}</p>
               </div>
               
               {currentUserRole === 'freelancer' && currentUserEmail !== gig.clientId ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-gray-700">Client's Budget:</span>
                     <span className="text-2xl font-bold text-green-600">${gig.amount || 0}</span>
                   </div>
                   
                   <button
                     onClick={() => setShowProposalForm(true)}
                     className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                   >
                     Submit Proposal
                   </button>
                   
                   <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                     <h4 className="font-semibold text-blue-800 mb-2">💡 How it works</h4>
                     <ul className="text-sm text-blue-700 space-y-1">
                       <li>• Submit your proposal with your bid and timeline</li>
                       <li>• Client reviews and accepts the best proposal</li>
                       <li>• Payment is processed securely through Stripe</li>
                       <li>• Work is completed and delivered to client</li>
                     </ul>
                   </div>
                 </div>
               ) : currentUserRole === 'client' && currentUserEmail === gig.clientId ? (
                 <div className="space-y-4">
                   <h4 className="font-semibold text-gray-900">Proposals Received</h4>
                   
                   {proposalsLoading ? (
                     <div className="flex justify-center items-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                     </div>
                   ) : proposals.length === 0 ? (
                     <div className="text-center py-8">
                       <div className="text-gray-500 mb-4">
                         <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                       </div>
                       <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                       <p className="text-gray-600">Proposals from freelancers will appear here.</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       <p className="text-sm text-gray-600">
                         {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} received
                       </p>
                       {proposals.map((proposal) => (
                         <div key={proposal._id} className="border border-gray-200 rounded-lg p-4">
                           <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-3">
                               {proposal.freelancerProfile.profilePhoto && (
                                 <img 
                                   src={proposal.freelancerProfile.profilePhoto} 
                                   alt={proposal.freelancerProfile.name}
                                   className="w-10 h-10 rounded-full object-cover"
                                 />
                               )}
                               <div>
                                 <h4 className="font-medium text-gray-900">{proposal.freelancerProfile.name}</h4>
                                 <p className="text-sm text-gray-600">{proposal.freelancerProfile.title}</p>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="font-semibold text-green-600">${proposal.bidAmount}</div>
                               <div className="text-sm text-gray-500">{proposal.estimatedDuration}</div>
                             </div>
                           </div>
                           
                           <div className="mb-3">
                             <p className="text-gray-700 text-sm line-clamp-3">{proposal.proposal}</p>
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <div className="text-xs text-gray-500">
                               Submitted {new Date(proposal.submittedAt).toLocaleDateString()}
                             </div>
                             {proposal.status === 'pending' && (
                               <div className="flex gap-2">
                                 <button
                                   onClick={() => handleProposalStatusUpdate(proposal._id, 'accepted')}
                                   className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                                 >
                                   Accept
                                 </button>
                                 <button
                                   onClick={() => handleProposalStatusUpdate(proposal._id, 'rejected')}
                                   className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                                 >
                                   Reject
                                 </button>
                               </div>
                             )}
                             {proposal.status === 'accepted' && (
                               <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                 Accepted
                               </span>
                             )}
                             {proposal.status === 'rejected' && (
                               <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                 Rejected
                               </span>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <h4 className="font-semibold text-gray-900 mb-2">Proposal System</h4>
                   <p className="text-gray-600 mb-4">
                     {currentUserEmail ? 
                       `You are logged in as ${currentUserEmail} (${currentUserRole || 'No role'})` : 
                       'Please log in to submit proposals'
                     }
                   </p>
                   {!currentUserEmail && (
                     <button
                       onClick={() => router.push('/login')}
                       className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                     >
                       Login to Submit Proposal
                     </button>
                   )}
                 </div>
               )}
             </div>

            {/* Gig Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Budget</h4>
                <div className="text-2xl font-bold text-green-600">${gig.amount || 0}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Duration</h4>
                <div className="text-lg text-gray-700">{gig.duration || 'Not specified'}</div>
              </div>
            </div>

            {/* Posted Date */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Posted on: {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown date'}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
          {reviewsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ReviewList
              reviews={reviews}
              onMarkHelpful={handleMarkHelpful}
              onSortChange={(sort) => {
                // You can implement sorting logic here
                console.log('Sort by:', sort);
              }}
            />
                     )}
         </div>
       </div>

       {/* Proposal Form Modal */}
       {showProposalForm && (
         <ProposalForm
           gigId={gigId}
           gigTitle={gig.title}
           gigBudget={gig.amount || 0}
           onClose={() => setShowProposalForm(false)}
           onSubmit={handleProposalSubmit}
         />
       )}
     </div>
   );
 } 
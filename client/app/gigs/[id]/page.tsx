"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

export default function GigDetail() {
  const { id: gigId } = useParams();
  const [gigData, setGigData] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGigData();
  }, [gigId]);

  const fetchGigData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gigs/${gigId}`);
      if (!response.ok) throw new Error('Gig not found');
      
      const data = await response.json();
      setGigData(data);

      // Fetch client data
      const clientResponse = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(data.clientId)}`);
      if (clientResponse.ok) {
        const clientInfo = await clientResponse.json();
        setClientData(clientInfo);
      }

      // Fetch proposals for this gig
      await fetchProposals();
    } catch (err) {
      setError('Failed to load gig details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals/gig/${gigId}/public`);
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    }
  };

  const submitProposal = async (proposalData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          gigId,
          ...proposalData
        })
      });

      if (response.ok) {
        await fetchProposals();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to submit proposal' };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading gig details...</div>
      </div>
    );
  }

  if (error || !gigData) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">{error || 'Gig not found'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Gig Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{gigData.title}</h1>
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-2xl font-bold text-blue-600">${gigData.amount}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{gigData.duration}</span>
          </div>
          <p className="text-gray-700 mb-6">{gigData.description}</p>
          
          {/* Skills */}
          {gigData.skills && gigData.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Skills Required:</h3>
              <div className="flex flex-wrap gap-2">
                {gigData.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Client Info */}
          {clientData && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Posted by:</h3>
              <div className="flex items-center space-x-3">
                <img
                  src={clientData.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                  alt="Client"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{clientData.name}</p>
                  <p className="text-sm text-gray-500">{clientData.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proposals Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Proposals ({proposals.length})</h2>
          
          {proposals.length === 0 ? (
            <p className="text-gray-500">No proposals yet. Be the first to submit one!</p>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{proposal.freelancerName}</h4>
                      <p className="text-gray-600">{proposal.proposal}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Proposed: ${proposal.proposedAmount}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
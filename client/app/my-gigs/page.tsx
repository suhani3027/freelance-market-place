"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';

interface Gig {
  _id: string;
  title: string;
  description: string;
  amount: number;
  duration: string;
  skills: string[];
  status: string;
  createdAt: string;
}

export default function MyGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const email = localStorage.getItem('email');
      if (!email) {
        setError('Please log in to view your gigs');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs?clientId=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      } else {
        setError('Failed to fetch gigs');
      }
    } catch (error) {
      setError('Failed to fetch gigs');
    } finally {
      setLoading(false);
    }
  };

  const deleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/gigs/${gigId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setGigs(gigs.filter(gig => gig._id !== gigId));
      } else {
        setError('Failed to delete gig');
      }
    } catch (error) {
      setError('Failed to delete gig');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading your gigs...</div>
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

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Gigs</h1>
          <a
            href="/gigs/new"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create New Gig
          </a>
        </div>

        {gigs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't created any gigs yet.</p>
            <a
              href="/gigs/new"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create Your First Gig
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <div key={gig._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg">{gig.title}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    gig.status === 'active' ? 'bg-green-100 text-green-800' :
                    gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {gig.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {gig.description}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold text-blue-600">${gig.amount}</span>
                  <span className="text-gray-500">{gig.duration}</span>
                </div>

                {gig.skills && gig.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {gig.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {gig.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                          +{gig.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {new Date(gig.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={`/gigs/edit/${gig._id}`}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => deleteGig(gig._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
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
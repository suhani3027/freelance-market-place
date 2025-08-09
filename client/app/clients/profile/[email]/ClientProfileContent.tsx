"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../../lib/api';

interface ClientProfileContentProps {
  email: string;
}

export default function ClientProfileContent({ email }: ClientProfileContentProps) {
  const [data, setData] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [pendingConnections, setPendingConnections] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const userData = await res.json();
        setData(userData);

        // Check connection status
        const connectionRes = await fetch(`${API_BASE_URL}/api/connections/check/${encodeURIComponent(userData.email)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (connectionRes.ok) {
          const connectionData = await connectionRes.json();
          setConnectionStatus(connectionData.status);
        }

        // Fetch pending connections
        const pendingRes = await fetch(`${API_BASE_URL}/api/connections/pending`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingConnections(pendingData);
        }

        // Fetch user's gigs
        const gigsRes = await fetch(`${API_BASE_URL}/api/gigs?clientId=${encodeURIComponent(userData.email)}`);
        if (gigsRes.ok) {
          const gigsData = await gigsRes.json();
          setGigs(gigsData);
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  const handleConnect = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetEmail: email })
      });
      
      if (res.ok) {
        setConnectionStatus('pending');
      }
    } catch (err) {
      console.error('Failed to send connection request');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>User not found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <img
            src={data.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
            alt="Profile"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-gray-600">{data.email}</p>
            {data.companyName && (
              <p className="text-gray-500">Company: {data.companyName}</p>
            )}
          </div>
        </div>

        {connectionStatus === 'none' && (
          <button
            onClick={handleConnect}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect
          </button>
        )}

        {connectionStatus === 'pending' && (
          <p className="mt-4 text-yellow-600">Connection request pending</p>
        )}

        {connectionStatus === 'connected' && (
          <p className="mt-4 text-green-600">Connected</p>
        )}

        {gigs.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Gigs by this user</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gigs.map((gig) => (
                <div key={gig._id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{gig.title}</h3>
                  <p className="text-gray-600">{gig.description}</p>
                  <p className="text-blue-600 font-semibold">${gig.amount}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

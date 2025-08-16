"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { getToken, getUser } from '../../lib/auth';

interface ConnectionButtonProps {
  targetEmail: string;
  className?: string;
}

export default function ConnectionButton({ targetEmail, className = "" }: ConnectionButtonProps) {
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected' | 'loading'>('loading');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, [targetEmail]);

  const checkConnectionStatus = async () => {
    try {
      const token = getToken();
      const currentUser = getUser();
      
      if (!token || !currentUser) {
        setConnectionStatus('none');
        return;
      }

      // Don't check connection status with yourself
      if (currentUser.email === targetEmail) {
        setConnectionStatus('none');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/connections/status/${encodeURIComponent(targetEmail)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'none') {
          setConnectionStatus('none');
        } else if (data.status === 'pending') {
          // Check if we're the requester or recipient
          if (data.connection?.requesterEmail === currentUser.email) {
            setConnectionStatus('pending_sent');
          } else {
            setConnectionStatus('pending_received');
          }
        } else if (data.status === 'accepted') {
          setConnectionStatus('accepted');
        } else if (data.status === 'rejected') {
          setConnectionStatus('rejected');
        }
      } else {
        console.error('Failed to check connection status:', res.status);
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('none');
    }
  };

  const sendConnectionRequest = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const token = getToken();
      const currentUser = getUser();
      
      if (!token || !currentUser) {
        alert('Please login to send connection requests');
        return;
      }

      // Don't allow connecting with yourself
      if (currentUser.email === targetEmail) {
        alert('You cannot connect with yourself');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/connections/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: targetEmail,
          message: `Hi! I'd like to connect with you on TaskNest.`
        })
      });

      if (res.ok) {
        setConnectionStatus('pending_sent');
        alert('Connection request sent successfully!');
      } else {
        const data = await res.json();
        if (res.status === 400 && data.message?.includes('already exists')) {
          // If connection already exists, check the status again
          await checkConnectionStatus();
        } else {
          alert(data.message || 'Failed to send connection request');
        }
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptConnectionRequest = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      // Get the connection ID from the pending request
      const res = await fetch(`${API_BASE_URL}/api/connections/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const pendingRequests = await res.json();
        const connection = pendingRequests.find((req: any) => req.requesterEmail === targetEmail);
        
        if (connection) {
          const acceptRes = await fetch(`${API_BASE_URL}/api/connections/accept/${connection._id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (acceptRes.ok) {
            setConnectionStatus('accepted');
            alert('Connection accepted! You can now message each other.');
          } else {
            alert('Failed to accept connection request');
          }
        }
      }
    } catch (error) {
      console.error('Error accepting connection request:', error);
      alert('Failed to accept connection request');
    } finally {
      setIsLoading(false);
    }
  };

  const rejectConnectionRequest = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      // Get the connection ID from the pending request
      const res = await fetch(`${API_BASE_URL}/api/connections/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const pendingRequests = await res.json();
        const connection = pendingRequests.find((req: any) => req.requesterEmail === targetEmail);
        
        if (connection) {
          const rejectRes = await fetch(`${API_BASE_URL}/api/connections/reject/${connection._id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (rejectRes.ok) {
            setConnectionStatus('rejected');
            alert('Connection request rejected');
          } else {
            alert('Failed to reject connection request');
          }
        }
      }
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      alert('Failed to reject connection request');
    } finally {
      setIsLoading(false);
    }
  };

  if (connectionStatus === 'loading') {
    return (
      <button 
        className={`px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed ${className}`}
        disabled
      >
        Loading...
      </button>
    );
  }

  if (connectionStatus === 'none') {
    return (
      <button
        onClick={sendConnectionRequest}
        disabled={isLoading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Sending...' : 'Connect'}
      </button>
    );
  }

  if (connectionStatus === 'pending_sent') {
    return (
      <button 
        className={`px-4 py-2 bg-yellow-500 text-white rounded-lg cursor-not-allowed ${className}`}
        disabled
      >
        Request Sent
      </button>
    );
  }

  if (connectionStatus === 'pending_received') {
    return (
      <div className="flex space-x-2">
        <button
          onClick={acceptConnectionRequest}
          disabled={isLoading}
          className={`px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Accepting...' : 'Accept'}
        </button>
        <button
          onClick={rejectConnectionRequest}
          disabled={isLoading}
          className={`px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    );
  }

  if (connectionStatus === 'rejected') {
    return (
      <button
        onClick={sendConnectionRequest}
        disabled={isLoading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Sending...' : 'Connect Again'}
      </button>
    );
  }

  if (connectionStatus === 'accepted') {
    return (
      <div className="flex space-x-2">
        <button 
          className={`px-4 py-2 bg-green-500 text-white rounded-lg cursor-not-allowed ${className}`}
          disabled
        >
          Connected ✓
        </button>
      </div>
    );
  }

  return null;
}

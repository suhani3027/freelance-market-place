'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalGigs: 0,
    activeGigs: 0,
    totalOrders: 0,
    totalEarnings: 0
  });
  const [proposalStats, setProposalStats] = useState({
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []); // Only run once on component mount

  // Separate useEffect for setting up the interval after user data is loaded
  useEffect(() => {
    if (!user) return; // Don't set up interval until user is loaded

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchStats(user.role, user.email);
      fetchProposalStats();
    }, 30000);

    // Cleanup function to clear interval
    return () => {
      clearInterval(interval);
    };
  }, [user]); // Only run when user changes

  const fetchUserData = async () => {
    try {
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      
      if (!email || !token) {
        setLoading(false);
        return;
      }

      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/user/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Fetch initial stats only once
        fetchStats(userData.role, email);
        fetchProposalStats();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (role: string, email: string) => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/stats/${role}/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        // Remove console.log to reduce spam - only log in development if needed
        // Stats updated successfully
        setStats(statsData);
      } else {
        console.error('Failed to fetch stats:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchProposalStats = async () => {
    try {
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');

      if (!email || !token || !role) {
        return;
      }

      const apiUrl = API_BASE_URL;
      
      // Fetch proposals stats
      const proposalsResponse = await fetch(`${apiUrl}/api/proposals/stats/${role}/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (proposalsResponse.ok) {
        const proposalData = await proposalsResponse.json();
        setProposalStats(proposalData);
      } else {
        console.error('Failed to fetch proposal stats:', proposalsResponse.status);
      }

      // Also fetch orders stats for completed projects
      try {
        const ordersResponse = await fetch(`${apiUrl}/api/payments/orders/${encodeURIComponent(email)}/${role}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          const completedOrders = ordersData.filter((order: any) => order.status === 'completed').length;
          
          // Update completed projects count
          setProposalStats(prev => ({
            ...prev,
            completed: completedOrders
          }));
        }
      } catch (error) {
        console.error('Failed to fetch orders for completed projects:', error);
      }
    } catch (error) {
      console.error('Failed to fetch proposal stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Please log in to view your dashboard.</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Beautiful gradient header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-normal mb-2">Welcome, {user.email}</h1>
                <h2 className="text-4xl font-bold mb-4">Manage your freelance business 🚀</h2>
                <p className="text-xl opacity-90">Grow your services and track performance</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    if (user.role === 'freelancer') {
                      router.push('/gigs');
                    } else {
                      router.push('/gigs/new');
                    }
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  {user.role === 'freelancer' ? 'Browse Gigs' : 'Create Gigs'}
                </button>
                <button
                  onClick={() => {
                    if (user.role === 'freelancer') {
                      router.push('/freelancer/proposals');
                    } else {
                      router.push('/clients/proposals');
                    }
                  }}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-all"
                >
                  {user.role === 'freelancer' ? 'My Proposals' : 'Proposals'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8">
          {/* Stats Cards */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Statistics</h2>
            {statsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Earnings</h3>
              <p className="text-3xl font-bold text-green-600">${stats.totalEarnings}</p>
              <p className="text-sm text-green-600 mt-1">From paid orders</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Orders</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.activeGigs}</p>
              <p className="text-sm text-blue-600 mt-1">In progress or awaiting start</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Connections</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-purple-600 mt-1">Accepted connections</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Average Rating</h3>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  ⭐⭐⭐⭐⭐
                </div>
                <span className="text-sm text-gray-600">4.8</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Based on reviews</p>
            </div>
          </div>

          {/* Proposal Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Proposals</h3>
              <p className="text-3xl font-bold text-yellow-600">{proposalStats.pending}</p>
              <p className="text-sm text-yellow-600 mt-1">Awaiting response</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Accepted Proposals</h3>
              <p className="text-3xl font-bold text-green-600">{proposalStats.accepted}</p>
              <p className="text-sm text-green-600 mt-1">Successfully won</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Completed Projects</h3>
              <p className="text-3xl font-bold text-blue-600">{proposalStats.completed}</p>
              <p className="text-sm text-blue-600 mt-1">Successfully delivered</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Rejected Proposals</h3>
              <p className="text-3xl font-bold text-red-600">{proposalStats.rejected}</p>
              <p className="text-sm text-red-600 mt-1">Not selected</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/messages')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-blue-600 mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h4 className="font-medium">View Messages</h4>
                <p className="text-sm text-gray-600">Check your conversations</p>
              </button>
              
              <button
                onClick={() => router.push('/notifications')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-blue-600 mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                  </svg>
                </div>
                <h4 className="font-medium">Notifications</h4>
                <p className="text-sm text-gray-600">Stay updated</p>
              </button>
              
              <button
                onClick={() => {
                  if (user.role === 'freelancer') {
                    router.push('/freelancer/profile');
                  } else {
                    router.push(`/clients/profile/${encodeURIComponent(user.email)}`);
                  }
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-blue-600 mb-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h4 className="font-medium">Edit Profile</h4>
                <p className="text-sm text-gray-600">Update your information</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
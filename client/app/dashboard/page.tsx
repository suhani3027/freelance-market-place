'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalGigs: 0,
    activeGigs: 0,
    totalOrders: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

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
        fetchStats(userData.role, email);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (role: string, email: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/stats/${role}/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg font-medium transition-all">
                Browse Gigs
              </button>
              <button className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-all">
                My Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8">
        {/* Stats Cards */}
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
              <span className="text-3xl font-bold text-gray-900">0.0</span>
            </div>
            <p className="text-sm text-orange-600 mt-1">0 reviews</p>
          </div>
        </div>

        {/* Proposals Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Proposals Overview</h3>
            <button className="text-blue-600 hover:text-blue-800 font-medium">View all</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-blue-600 font-medium text-sm mb-1">Pending</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-medium text-sm mb-1">Accepted</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-orange-600 font-medium text-sm mb-1">Completed</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-red-600 font-medium text-sm mb-1">Rejected</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Gigs</h3>
            <p className="text-gray-600 mb-4">Find projects</p>
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors">
              View Projects
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Profile</h3>
            <p className="text-gray-600 mb-4">Update information</p>
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Gigs</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalGigs}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Gigs</h3>
            <p className="text-3xl font-bold text-green-600">{stats.activeGigs}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.totalOrders}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-green-600">${stats.totalEarnings}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">
            You are logged in as a {user.role}. Here&apos;s your activity overview.
          </p>
        </div>
      </div>
    </div>
  );
}
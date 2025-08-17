'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../lib/auth.js';
import Link from 'next/link';

interface Gig {
  _id: string;
  title: string;
  description: string;
  amount: number;
  duration: string;
  skills: string[];
  status: string;
  createdAt: string;
  image?: string;
  orders?: number;
  views?: number;
  rating?: number;
  reviewCount?: number;
}

interface Stats {
  totalGigs: number;
  activeGigs: number;
  totalOrders: number;
  avgRating: number;
  totalViews: number;
}

export default function MyGigsPage() {
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortBy, setSortBy] = useState('Newest First');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState<Stats>({
    totalGigs: 0,
    activeGigs: 0,
    totalOrders: 0,
    avgRating: 0,
    totalViews: 0
  });

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [gigs]);

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
        alert('Only clients can view their gigs');
        router.push('/dashboard');
        return;
      }
      
      setUser(userData);
      fetchMyGigs();
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuthData();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGigs = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching gigs');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/my-gigs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch gigs:', response.status);
        setError('Failed to load gigs');
      }
    } catch (error) {
      console.error('Failed to fetch gigs:', error);
      setError('Failed to load gigs');
    }
  };

  const updateGigStatus = async (gigId: string, status: string) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for updating gig status');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/${gigId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setGigs(gigs.map(gig => 
          gig._id === gigId ? { ...gig, status } : gig
        ));
        alert('Gig status updated successfully');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to update gig status');
      }
    } catch (error) {
      console.error('Error updating gig status:', error);
      alert('Failed to update gig status');
    }
  };

  const deleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;

    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for deleting gig');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/${gigId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setGigs(gigs.filter(gig => gig._id !== gigId));
        alert('Gig deleted successfully');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to delete gig');
      }
    } catch (error) {
      console.error('Error deleting gig:', error);
      alert('Failed to delete gig');
    }
  };

  const calculateStats = () => {
    const totalGigs = gigs.length;
    const activeGigs = gigs.filter(gig => gig.status === 'active').length;
    const totalOrders = gigs.reduce((sum, gig) => sum + (gig.orders || 0), 0);
    const totalViews = gigs.reduce((sum, gig) => sum + (gig.views || 0), 0);
    
    const ratings = gigs.filter(gig => gig.rating && gig.rating > 0).map(gig => gig.rating || 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    setStats({
      totalGigs,
      activeGigs,
      totalOrders,
      avgRating: Math.round(avgRating * 10) / 10,
      totalViews
    });
  };

  const filteredAndSortedGigs = () => {
    let filtered = gigs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(gig =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'All Status') {
      filtered = filtered.filter(gig => gig.status === statusFilter.toLowerCase());
    }

    // Apply sorting
    switch (sortBy) {
      case 'Newest First':
        filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'Oldest First':
        filtered = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'Price: High to Low':
        filtered = [...filtered].sort((a, b) => b.amount - a.amount);
        break;
      case 'Price: Low to High':
        filtered = [...filtered].sort((a, b) => a.amount - b.amount);
        break;
      case 'Most Popular':
        filtered = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'Active', class: 'bg-green-100 text-green-800 border-green-200' };
      case 'paused':
        return { text: 'Paused', class: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'draft':
        return { text: 'Draft', class: 'bg-gray-100 text-gray-800 border-gray-200' };
      case 'pending':
        return { text: 'Pending Approval', class: 'bg-blue-100 text-blue-800 border-blue-200' };
      default:
        return { text: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '▶️';
      case 'paused':
        return '⏸️';
      case 'draft':
        return '📝';
      case 'pending':
        return '⏳';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your gigs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="text-red-500 text-xl mb-4">Error: {error}</div>
            <button 
              onClick={fetchMyGigs}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayGigs = filteredAndSortedGigs();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Gigs</h1>
              <p className="text-lg text-gray-600">Manage your services and track performance</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchMyGigs}
                disabled={loading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                🔄 Refresh
              </button>
              <Link
                href="/gigs/new"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                + Create New Gig
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{stats.totalGigs}</span>
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <p className="text-sm text-gray-600">Total Gigs</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{stats.activeGigs}</span>
                <span className="text-green-600 text-xl">▶️</span>
              </div>
              <p className="text-sm text-gray-600">Active Gigs</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{stats.totalOrders}</span>
                <span className="text-blue-600 text-xl">📈</span>
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{stats.avgRating}</span>
                <span className="text-yellow-600 text-xl">⭐</span>
              </div>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</span>
                <span className="text-blue-600 text-xl">👁️</span>
              </div>
              <p className="text-sm text-gray-600">Total Views</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search gigs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Draft</option>
                  <option>Pending</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Newest First</option>
                  <option>Oldest First</option>
                  <option>Price: High to Low</option>
                  <option>Price: Low to High</option>
                  <option>Most Popular</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                {displayGigs.length} of {gigs.length} gigs
              </div>
            </div>
          </div>

          {/* Gigs Grid */}
          {displayGigs.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <p className="text-xl text-gray-600 mb-4">
                {gigs.length === 0 ? "You haven't created any gigs yet." : "No gigs match your search criteria."}
              </p>
              {gigs.length === 0 && (
                <Link
                  href="/gigs/new"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Create Your First Gig
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGigs.map((gig) => {
                const statusBadge = getStatusBadge(gig.status);
                const statusIcon = getStatusIcon(gig.status);
                
                return (
                  <div key={gig._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                    {/* Image and Status */}
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        {gig.image ? (
                          <img 
                            src={gig.image} 
                            alt={gig.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-4xl text-gray-400">📱</div>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.class}`}>
                          {statusIcon} {statusBadge.text}
                        </span>
                      </div>

                      {/* Queue Badge */}
                      {gig.orders && gig.orders > 0 && (
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                            {gig.orders} in queue
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {gig.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {gig.description}
                      </p>

                      {/* Rating */}
                      {gig.rating && gig.rating > 0 ? (
                        <div className="flex items-center mb-3">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>
                                {i < Math.floor(gig.rating!) ? '★' : i < Math.ceil(gig.rating!) ? '☆' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {gig.rating} ({gig.reviewCount || 0})
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 mb-3">No reviews yet</div>
                      )}

                      {/* Price and Duration */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-2xl font-bold text-blue-600">
                          ${gig.amount}
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {gig.duration}
                        </div>
                      </div>

                      {/* Skills */}
                      {gig.skills && gig.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {gig.skills.slice(0, 2).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {gig.skills.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                +{gig.skills.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{gig.orders || 0}</div>
                          <div className="text-gray-500">Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">{gig.views || 0}</div>
                          <div className="text-gray-500">Views</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/gigs/${gig._id}`}
                          onClick={() => {
                            // Increment view count for sample gigs
                            if (gig._id.startsWith('sample')) {
                              setGigs(prevGigs => 
                                prevGigs.map(g => 
                                  g._id === gig._id ? { ...g, views: (g.views || 0) + 1 } : g
                                )
                              );
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium text-center transition-colors"
                        >
                          👁️ View
                        </Link>
                        <Link
                          href={`/gigs/edit/${gig._id}`}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium text-center transition-colors"
                        >
                          ✏️ Edit
                        </Link>
                        <button 
                          onClick={() => updateGigStatus(gig._id, gig.status === 'active' ? 'paused' : 'active')}
                          className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm font-medium transition-colors"
                        >
                          {gig.status === 'active' ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          onClick={() => deleteGig(gig._id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
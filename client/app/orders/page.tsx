'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';

interface Order {
  _id: string;
  gigTitle: string;
  amount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  gigId: string;
  clientEmail: string;
  freelancerEmail: string;
  description?: string;
  paid?: boolean;
  proposalId: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('ongoing');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      
      if (!email || !token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        fetchOrders(email, userData.role);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (email: string, role: string) => {
    try {
      const token = localStorage.getItem('token');
      
      let proposalsResponse;
      if (role === 'freelancer') {
        // Freelancers see all their accepted proposals
        proposalsResponse = await fetch(`${API_BASE_URL}/api/proposals/freelancer/accepted`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Clients see accepted proposals for gigs they posted
        proposalsResponse = await fetch(`${API_BASE_URL}/api/proposals/client`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (proposalsResponse.ok) {
        const proposalsData = await proposalsResponse.json();
        
        // Filter proposals based on role
        let filteredProposals;
        if (role === 'freelancer') {
          // Freelancers see all accepted proposals they submitted
          filteredProposals = proposalsData.filter((proposal: any) => 
            proposal.status === 'accepted' || proposal.status === 'completed' || proposal.status === 'paid'
          );
        } else {
          // Clients see only accepted proposals for gigs they posted
          filteredProposals = proposalsData.filter((proposal: any) => 
            proposal.status === 'accepted' || proposal.status === 'completed' || proposal.status === 'paid'
          );
        }

        // Transform proposals to orders with proper categorization
        const transformedOrders = filteredProposals.map((proposal: any) => {
          // Determine the actual status based on completion and payment
          let orderStatus = 'ongoing'; // Default to ongoing
          let isPaid = false;

          if (proposal.status === 'completed') {
            // Check if payment has been made
            if (proposal.paid || proposal.status === 'paid') {
              orderStatus = 'completed';
              isPaid = true;
            } else {
              orderStatus = 'pending_payment';
              isPaid = false;
            }
          } else if (proposal.status === 'accepted') {
            orderStatus = 'ongoing';
            isPaid = false;
          }

          return {
            _id: proposal._id,
            proposalId: proposal._id,
            gigTitle: proposal.gigId?.title || proposal.gig?.title || 'Project',
            amount: proposal.bidAmount || proposal.amount || 0,
            status: orderStatus,
            createdAt: proposal.submittedAt || proposal.createdAt || new Date().toISOString(),
            completedAt: proposal.completedAt,
            gigId: proposal.gigId?._id || proposal.gigId || proposal.gig?._id || '',
            clientEmail: proposal.clientId || proposal.client?.email || '',
            freelancerEmail: proposal.freelancerId || proposal.freelancer?.email || '',
            description: proposal.proposal || proposal.description || '',
            paid: isPaid
          };
        });
        
        setOrders(transformedOrders);
        setError('');
      } else {
        setOrders([]);
        setError('No accepted proposals found');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setError('Failed to fetch orders. Please try again later.');
    }
  };

  const markAsCompleted = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Check if already completed
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        setError('Order not found');
        return;
      }
      
      if (order.status === 'completed' || order.status === 'pending_payment') {
        setError('This project is already marked as completed');
        return;
      }

      // Use the correct endpoint for marking as completed
      const response = await fetch(`${API_BASE_URL}/api/proposals/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh orders
        const email = localStorage.getItem('email');
        const role = localStorage.getItem('role');
        if (email && role) {
          fetchOrders(email, role);
        }
        alert('Project marked as completed!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Failed to mark project as completed');
      }
    } catch (error) {
      console.error('Error marking as completed:', error);
      setError('Failed to mark project as completed');
    }
  };

  const submitReview = async (orderId: string, rating: number, comment: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const order = orders.find(o => o._id === orderId);
      if (!order) {
        setError('Order not found');
        return;
      }

      const currentUserEmail = localStorage.getItem('email');
      const targetId = user.role === 'client' ? order.freelancerEmail : order.clientEmail;
      
      if (!targetId) {
        setError('Target user not found');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewType: 'gig',
          targetId: targetId,
          gigId: order.gigId,
          orderId: orderId,
          rating: rating,
          comment: comment,
          title: `Review for ${order.gigTitle}`
        })
      });

      if (response.ok) {
        const email = localStorage.getItem('email');
        const role = localStorage.getItem('role');
        if (email && role) {
          fetchOrders(email, role);
        }
        alert('Review submitted successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      setError('Failed to submit review');
    }
  };

  const getFilteredOrders = () => {
    if (activeTab === 'ongoing') {
      return orders.filter(order => order.status === 'ongoing');
    } else if (activeTab === 'completed') {
      return orders.filter(order => order.status === 'completed');
    } else if (activeTab === 'pending_payment') {
      return orders.filter(order => order.status === 'pending_payment');
    }
    return orders;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'In Progress';
      case 'completed':
        return 'Completed & Paid';
      case 'pending_payment':
        return 'Completed - Payment Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view your orders.</p>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();
  const ongoingCount = orders.filter(o => o.status === 'ongoing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const pendingPaymentCount = orders.filter(o => o.status === 'pending_payment').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            {user.role === 'freelancer' 
              ? 'Track your accepted proposals and project progress' 
              : 'Track projects for gigs you posted'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Projects</h3>
            <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-600 mt-1">All time</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Ongoing</h3>
            <p className="text-3xl font-bold text-blue-600">{ongoingCount}</p>
            <p className="text-sm text-blue-600 mt-1">In progress</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-green-600 mt-1">Successfully delivered</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Pending Payments</h3>
            <p className="text-3xl font-bold text-yellow-600">{pendingPaymentCount}</p>
            <p className="text-sm text-yellow-600 mt-1">Awaiting payment</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ongoing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ongoing Projects ({ongoingCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Completed Projects ({completedCount})
              </button>
              <button
                onClick={() => setActiveTab('pending_payment')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending_payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Payments ({pendingPaymentCount})
              </button>
            </nav>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {error && (
            <div className="p-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600">{error}</p>
              </div>
              <button 
                onClick={() => {
                  const email = localStorage.getItem('email');
                  const role = localStorage.getItem('role');
                  if (email && role) {
                    fetchOrders(email, role);
                  }
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'ongoing' ? 'No ongoing projects' :
                 activeTab === 'completed' ? 'No completed projects' :
                 'No pending payments'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'ongoing' ? 'You don\'t have any ongoing projects at the moment.' :
                 activeTab === 'completed' ? 'You haven\'t completed any projects yet.' :
                 'You don\'t have any pending payments.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div key={order._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{order.gigTitle}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><span className="font-medium">Amount:</span> ${order.amount}</p>
                          <p><span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                          {order.completedAt && (
                            <p><span className="font-medium">Completed:</span> {new Date(order.completedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div>
                          <p><span className="font-medium">Client:</span> {order.clientEmail}</p>
                          <p><span className="font-medium">Freelancer:</span> {order.freelancerEmail}</p>
                          {order.description && (
                            <p><span className="font-medium">Description:</span> {order.description.substring(0, 100)}...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                    {user.role === 'freelancer' && order.status === 'ongoing' && (
                      <button
                        onClick={() => markAsCompleted(order._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                    
                    {order.status === 'completed' && (
                      <button
                        onClick={() => {
                          // Open review form
                          const rating = prompt('Rate this project (1-5):');
                          const comment = prompt('Leave a comment:');
                          if (rating && comment) {
                            submitReview(order._id, parseInt(rating), comment);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Submit Review
                      </button>
                    )}

                    {user.role === 'client' && order.status === 'pending_payment' && (
                      <button
                        onClick={() => {
                          // Redirect to payment page
                          window.location.href = `/payment?proposalId=${order.proposalId}&amount=${order.amount}`;
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        Make Payment
                      </button>
                    )}

                    <button
                      onClick={() => window.location.href = `/gigs/${order.gigId}`}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View Gig
                    </button>
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

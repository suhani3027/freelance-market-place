"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../lib/auth.js';
import { useRouter } from 'next/navigation';

interface Order {
  _id: string;
  gigTitle: string;
  amount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  freelancerEmail?: string;
  clientEmail?: string;
  gigId?: string;
}

interface OrdersListProps {
  userId: string;
  role: string;
}

export default function OrdersList({ userId, role }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [userId, role]);

  const fetchOrders = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching orders');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch orders:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const markAsCompleted = async (orderId) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for marking order as completed');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update local state
        setOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, status: 'completed' }
              : order
          )
        );
        alert('Order marked as completed successfully!');
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to mark order as completed');
      }
    } catch (error) {
      console.error('Error marking order as completed:', error);
      alert('Failed to mark order as completed');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for updating order status');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setOrders(prev => 
          prev.map(order => 
            order._id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        alert(`Order status updated to ${newStatus} successfully!`);
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const submitReview = async (orderId, rating, comment) => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for submitting review');
        return;
      }

      const order = orders.find(o => o._id === orderId);
      if (!order) return;

      const targetId = order.freelancerEmail || order.clientEmail;
      const reviewType = order.freelancerEmail ? 'freelancer' : 'client';

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reviewType: reviewType,
          targetId: targetId,
          orderId: orderId,
          rating: rating,
          comment: comment,
          title: `Review for ${order.gigTitle}`
        })
      });

      if (response.ok) {
        alert('Review submitted successfully!');
        // Refresh orders
        fetchOrders();
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{order.gigTitle}</h3>
                <p className="text-gray-600">${order.amount}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-sm ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
            
            {order.status === 'pending' && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => updateOrderStatus(order._id, 'cancelled')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
} 
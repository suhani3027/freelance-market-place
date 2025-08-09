"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';

interface Order {
  _id: string;
  gigTitle: string;
  amount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface OrdersListProps {
  userId: string;
  role: string;
}

export default function OrdersList({ userId, role }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [userId, role]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/orders/${userId}/${role}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders();
      } else {
        setError('Failed to update order status');
      }
    } catch (error) {
      setError('Failed to update order status');
    }
  };

  const submitReview = async (orderId: string, rating: number, comment: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment
        })
      });

      if (response.ok) {
        fetchOrders();
      } else {
        setError('Failed to submit review');
      }
    } catch (error) {
      setError('Failed to submit review');
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
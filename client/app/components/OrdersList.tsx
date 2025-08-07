"use client";
import React, { useEffect, useState } from 'react';
import OrderStatus from './OrderStatus';
import ReviewForm from '../../components/ReviewForm';

interface Order {
  _id: string;
  gigId: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  gigTitle: string;
  createdAt: string;
  description?: string;
}

interface OrdersListProps {
  userId: string;
  role: 'client' | 'freelancer';
}

export default function OrdersList({ userId, role }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [userId, role]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/orders/${userId}/${role}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/payments/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleReviewSubmit = async (reviewData: { rating: number; comment: string; isAnonymous: boolean }) => {
    if (!selectedOrder) return;

    setSubmittingReview(true);
    try {
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          ...reviewData
        })
      });

      if (response.ok) {
        setShowReviewForm(false);
        setSelectedOrder(null);
        // Show success message
        alert('Review submitted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLeaveReview = (order: Order) => {
    setSelectedOrder(order);
    setShowReviewForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-600">
          {role === 'client' 
            ? "You haven't purchased any gigs yet." 
            : "You haven't received any orders yet."
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{order.gigTitle}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Order ID: {order._id.slice(-8)}</span>
                  <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-green-600">${order.amount}</span>
                </div>
              </div>
              <OrderStatus status={order.status} />
            </div>

            {order.description && (
              <p className="text-gray-700 mb-4 text-sm">{order.description}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {role === 'client' ? (
                  <span>Freelancer: {order.freelancerId}</span>
                ) : (
                  <span>Client: {order.clientId}</span>
                )}
              </div>

              {role === 'freelancer' && order.status === 'paid' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateOrderStatus(order._id, 'in_progress')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    Start Work
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order._id, 'completed')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                  >
                    Mark Complete
                  </button>
                </div>
              )}

              {role === 'client' && order.status === 'in_progress' && (
                <button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                >
                  Mark Complete
                </button>
              )}

              {role === 'client' && order.status === 'completed' && (
                <button
                  onClick={() => handleLeaveReview(order)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  Leave Review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedOrder && (
        <ReviewForm
          orderId={selectedOrder._id}
          gigTitle={selectedOrder.gigTitle}
          onSubmit={handleReviewSubmit}
          onCancel={() => {
            setShowReviewForm(false);
            setSelectedOrder(null);
          }}
          isLoading={submittingReview}
        />
      )}
    </>
  );
} 
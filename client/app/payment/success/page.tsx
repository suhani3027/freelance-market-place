"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const orderId = searchParams?.get('orderId');
    if (orderId) {
      confirmPayment(orderId);
    } else {
      setError('No order ID found');
      setLoading(false);
    }
  }, [searchParams]);

  const confirmPayment = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/confirm-payment?orderId=${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Payment confirmation failed');
      }
    } catch (error) {
      setError('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Confirming payment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 text-2xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/dashboard"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been confirmed and your order is being processed.
        </p>
        <div className="space-y-4">
          <a
            href="/dashboard"
            className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Dashboard
          </a>
          <a
            href="/gigs"
            className="block w-full px-6 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
          >
            Browse More Gigs
          </a>
        </div>
      </div>
    </div>
  );
} 
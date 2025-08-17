"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '../../../lib/api.js';
import { getToken, isValidTokenFormat, clearAuthData } from '../../../lib/auth.js';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const router = useRouter();

  const orderId = searchParams?.get('orderId');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching payment details');
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/payments/confirm-payment?orderId=${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
        setSuccess(true);
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch payment details:', response.status);
        setError('Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      setError('Failed to fetch payment details');
    } finally {
      setLoading(false);
    }
  };

    if (orderId) {
      fetchPaymentDetails();
    } else {
      setError('No order ID found');
      setLoading(false);
    }
  }, [orderId]);

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
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Dashboard
          </Link>
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
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/gigs"
            className="block w-full px-6 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
          >
            Browse More Gigs
          </Link>
        </div>
      </div>
    </div>
  );
}

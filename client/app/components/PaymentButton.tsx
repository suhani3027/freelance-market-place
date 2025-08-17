"use client";

import { useState } from 'react';
import { API_BASE_URL } from '../../lib/api.js';
import { getToken, isValidTokenFormat, clearAuthData } from '../../lib/auth.js';
import { useRouter } from 'next/navigation';

interface PaymentButtonProps {
  gigId: string;
  amount: number;
  title: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export default function PaymentButton({ gigId, amount, title, onSuccess, onError }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gigId: gigId,
          clientId: localStorage.getItem('email') || 'unknown',
          amount: amount,
          gigTitle: title
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Payment session created but no checkout URL received');
        }
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
    >
      {loading ? 'Processing...' : `Pay $${amount}`}
    </button>
  );
} 
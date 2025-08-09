"use client";

import { useState } from 'react';
import { API_BASE_URL } from '../../lib/api';

interface PaymentButtonProps {
  gigId: string;
  amount: number;
  title: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PaymentButton({ gigId, amount, title, onSuccess, onError }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          gigId,
          amount,
          title
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          onError?.('Failed to create checkout session');
        }
      } else {
        const errorData = await response.json();
        onError?.(errorData.message || 'Payment failed');
      }
    } catch (error) {
      onError?.('Payment failed. Please try again.');
    } finally {
      setLoading(false);
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
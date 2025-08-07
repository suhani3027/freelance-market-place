"use client";
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentButtonProps {
  gigId: string;
  amount: number;
  gigTitle: string;
  clientId: string;
  onPaymentSuccess?: (orderId: string) => void;
  onPaymentError?: (error: string) => void;
  disabled?: boolean;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentButton({ 
  gigId, 
  amount, 
  gigTitle, 
  clientId, 
  onPaymentSuccess, 
  onPaymentError,
  disabled = false 
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (disabled) return;
    
    setLoading(true);
    try {
      // Create checkout session
      const response = await fetch('http://localhost:5000/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          gigId,
          clientId,
          amount,
          gigTitle
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId, orderId } = await response.json();

      // Load Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      onPaymentError?.(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
          disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : loading 
              ? 'bg-blue-500 cursor-wait' 
              : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Purchase Now - $${amount}`
        )}
      </button>
      
      {disabled && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          You cannot purchase your own gig
        </p>
      )}
    </div>
  );
} 
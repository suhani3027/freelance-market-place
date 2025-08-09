"use client";

import { Suspense } from 'react';
import PaymentSuccessContent from './PaymentSuccessContent';

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 
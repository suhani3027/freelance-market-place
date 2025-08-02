'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const role = localStorage.getItem('role');
      if (role === 'freelancer') {
        router.push('/freelancer/questions');
      } else if (role === 'client') {
        router.push('/dashboard');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to TaskNest</h1>
      <p className="text-lg">We're excited to have you on board!</p>
    </div>
  );
} 
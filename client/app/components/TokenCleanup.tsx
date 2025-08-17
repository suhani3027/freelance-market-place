"use client";

import { useEffect } from 'react';
import { cleanupExpiredTokens, isAuthenticated, clearAuthData } from '../../lib/auth.js';
import { useRouter } from 'next/navigation';

export default function TokenCleanup() {
  const router = useRouter();

  useEffect(() => {
    // Clean up expired tokens on component mount
    const cleanup = () => {
      try {
        const wasExpired = cleanupExpiredTokens();
        
        if (wasExpired) {
          console.log('🔄 Expired token detected and cleaned up');
          
          // Redirect to login if we're not already there
          if (window.location.pathname !== '/login' && 
              window.location.pathname !== '/login/clients' && 
              window.location.pathname !== '/login/freelancer' &&
              window.location.pathname !== '/register' &&
              window.location.pathname !== '/register/clients' &&
              window.location.pathname !== '/register/freelancer') {
            console.log('🔄 Redirecting to login due to expired token');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error during token cleanup:', error);
      }
    };

    // Run cleanup immediately
    cleanup();

    // Set up periodic cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}

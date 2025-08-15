'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    
    if (!token || !email) {
      // User is not authenticated, redirect to login
      router.push('/login');
      return;
    }
    
    try {
      // Verify token is still valid by making an API call
      const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Failed to verify authentication:', error);
      router.push('/login');
      return;
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <p>Access denied. Please log in to continue.</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
}

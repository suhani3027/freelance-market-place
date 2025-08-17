'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api.js';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../lib/auth.js';

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
    
    try {
      const token = getToken();
      const userData = getUser();
      
      // Also check for legacy token format
      const legacyToken = localStorage.getItem('token');
      const legacyEmail = localStorage.getItem('email');
      const legacyRole = localStorage.getItem('role');
      
      if (token && userData && isValidTokenFormat(token)) {
        // Verify token is still valid by making an API call
        const response = await fetch(`${API_BASE_URL}/api/user/${encodeURIComponent(userData.email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userDataFromApi = await response.json();
          setUser(userDataFromApi);
          setIsAuthenticated(true);
        } else if (response.status === 401) {
          // Token expired or invalid
          console.log('Token validation failed, clearing auth data and redirecting to login');
          clearAuthData();
          router.push('/login');
          return;
        } else {
          // Other error
          console.error('API error during authentication check:', response.status);
          clearAuthData();
          router.push('/login');
          return;
        }
      } else if (legacyToken && legacyEmail && legacyRole) {
        // Handle legacy token format
        const legacyUser = { email: legacyEmail, role: legacyRole, name: localStorage.getItem('name') };
        setUser(legacyUser);
        setIsAuthenticated(true);
      } else {
        // User is not authenticated, redirect to login
        console.log('No valid token or user data found, redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Failed to verify authentication:', error);
      clearAuthData();
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
          <div className="w-8 h-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

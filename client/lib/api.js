import { getToken, getRefreshToken, clearAuthData, isValidTokenFormat, isTokenExpired, cleanupExpiredTokens } from './auth.js';

// API configuration utility
const getApiBaseUrl = () => {
  // First, check if environment variable is set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're in production (Vercel, Netlify, etc.)
  if (typeof window !== 'undefined') {
    // Client-side: check if we're on a production domain
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // PRODUCTION: Use your actual backend URL
      return 'https://tasknest-e3cf.onrender.com';
    }
  }
  
  // Development environment
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Socket URL configuration
export const getSocketUrl = () => {
  // First, check if environment variable is set
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // PRODUCTION: Use your actual backend URL
      return 'https://tasknest-e3cf.onrender.com';
    }
  }
  return 'http://localhost:5000';
};

// Enhanced API request with better token validation
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Clean up expired tokens first
  if (typeof window !== 'undefined') {
    cleanupExpiredTokens();
  }
  
  // Build default headers and preserve caller-specified headers via deep-merge
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  // Attach auth token by default if present and caller didn't supply Authorization
  try {
    if (typeof window !== 'undefined') {
      const token = getToken();
      
      // Only add token if it's valid and not expired
      if (token && isValidTokenFormat(token) && !isTokenExpired(token) && !defaultOptions.headers.Authorization) {
        defaultOptions.headers.Authorization = `Bearer ${token}`;
      } else if (token && (!isValidTokenFormat(token) || isTokenExpired(token))) {
        // Token is invalid or expired, clear it
        console.warn('Invalid or expired token detected, clearing auth data');
        clearAuthData();
        
        // Redirect to login if we're not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/login/clients' && window.location.pathname !== '/login/freelancer') {
          window.location.href = '/login';
          throw new Error('Authentication required');
        }
      }
    }
  } catch (error) {
    console.error('Error handling authentication:', error);
    if (error.message === 'Authentication required') {
      throw error;
    }
  }

  // Deep-merge headers so we don't lose Authorization when caller passes custom headers
  const mergedHeaders = {
    ...defaultOptions.headers,
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle authentication errors globally
    if (response.status === 401) {
      console.warn('Authentication failed:', errorData.error || errorData.message);
      
      // Clear invalid auth data
      if (typeof window !== 'undefined') {
        clearAuthData();
        
        // Try to refresh token if we have a refresh token
        const refreshToken = getRefreshToken();
        if (refreshToken && isValidTokenFormat(refreshToken)) {
          try {
            console.log('🔄 Attempting to refresh token...');
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // Validate the new token before storing
              if (refreshData.accessToken && isValidTokenFormat(refreshData.accessToken)) {
                // Update the token in storage
                if (typeof window !== 'undefined') {
                  localStorage.setItem('accessToken', refreshData.accessToken);
                }
                console.log('✅ Token refreshed successfully');
                
                // Retry the original request with new token
                const retryResponse = await fetch(url, {
                  ...defaultOptions,
                  ...options,
                  headers: {
                    ...mergedHeaders,
                    Authorization: `Bearer ${refreshData.accessToken}`
                  }
                });
                
                if (retryResponse.ok) {
                  return retryResponse.json();
                } else {
                  throw new Error(`Retry failed: ${retryResponse.status}`);
                }
              } else {
                console.error('❌ Invalid token received from refresh endpoint');
                throw new Error('Invalid token received from refresh endpoint');
              }
            } else {
              console.log('❌ Token refresh failed:', refreshResponse.status);
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            throw new Error('Token refresh failed');
          }
        }
        
        // If no refresh token or refresh failed, redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/login/clients' && window.location.pathname !== '/login/freelancer') {
          console.log('🔄 Redirecting to login...');
          window.location.href = '/login';
        }
      }
    }
    
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function to make API calls with error handling
export const makeApiCall = async (endpoint, options = {}) => {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Helper function to check if user is authenticated before making API calls
export const authenticatedApiCall = async (endpoint, options = {}) => {
  if (typeof window !== 'undefined') {
    const token = getToken();
    if (!token || !isValidTokenFormat(token) || isTokenExpired(token)) {
      throw new Error('Authentication required');
    }
  }
  
  return makeApiCall(endpoint, options);
};

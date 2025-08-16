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

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken && !defaultOptions.headers.Authorization) {
        defaultOptions.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
  } catch {}

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
    // Handle token expiry globally
    if (response.status === 401 && (errorData.error === 'Token expired' || /expired/i.test(errorData.message || ''))) {
      try {
        if (typeof window !== 'undefined') {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            console.log('🔄 Attempting to refresh token...');
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('accessToken', refreshData.accessToken);
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
              }
            } else {
              console.log('❌ Token refresh failed:', refreshResponse.status);
            }
          }
          
          // If refresh failed, clear storage and redirect to login
          console.log('🔄 Clearing auth data and redirecting to login...');
          clearAuthData();
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear storage and redirect to login
        try {
          clearAuthData();
          window.location.href = '/login';
        } catch {}
      }
    }
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function to make API calls with error handling
// Utility function to get current access token
export const getCurrentToken = () => {
  if (typeof window !== 'undefined') {
    // Auto-migrate old token format if needed
    migrateOldToken();
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Utility function to get current refresh token
export const getCurrentRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

// Utility function to clear all auth data
export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('profilePhoto');
  }
};

// Utility function to migrate old token format to new format
export const migrateOldToken = () => {
  if (typeof window !== 'undefined') {
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      // If old token exists, treat it as an access token and create a temporary refresh token
      localStorage.setItem('accessToken', oldToken);
      localStorage.setItem('refreshToken', oldToken); // Temporary, will be replaced on next login
      localStorage.removeItem('token');
      console.log('🔄 Migrated old token format to new format');
      return true;
    }
  }
  return false;
};

export const makeApiCall = async (endpoint, options = {}) => {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

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
      return 'https://freelance-marketplace-backend.onrender.com';
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
      return 'https://freelance-marketplace-backend.onrender.com';
    }
  }
  return 'http://localhost:5000';
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

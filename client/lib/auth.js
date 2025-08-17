// Centralized authentication utility with proper token validation
export class AuthManager {
  static getToken() {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('accessToken');
    
    // Validate token format before returning
    if (accessToken && this.isValidTokenFormat(accessToken)) {
      return accessToken;
    }
    
    // If token is invalid, clear it and return null
    if (accessToken) {
      console.warn('Invalid token format detected, clearing token');
      this.clearAuthData();
    }
    
    return null;
  }

  static getRefreshToken() {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Validate refresh token format
    if (refreshToken && this.isValidTokenFormat(refreshToken)) {
      return refreshToken;
    }
    
    // If refresh token is invalid, clear it
    if (refreshToken) {
      console.warn('Invalid refresh token format detected, clearing refresh token');
      localStorage.removeItem('refreshToken');
    }
    
    return null;
  }

  static getUser() {
    if (typeof window === 'undefined') return null;
    
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    
    if (email && role) {
      return { email, role, name };
    }
    
    return null;
  }

  static isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return token !== null && user !== null && this.isValidTokenFormat(token);
  }

  static setAuthData(accessToken, refreshToken, user) {
    if (typeof window === 'undefined') return;
    
    // Validate tokens before storing
    if (!this.isValidTokenFormat(accessToken)) {
      console.error('Invalid access token format');
      return false;
    }
    
    if (refreshToken && !this.isValidTokenFormat(refreshToken)) {
      console.error('Invalid refresh token format');
      return false;
    }
    
    try {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('email', user.email);
      localStorage.setItem('role', user.role);
      if (user.name) {
        localStorage.setItem('name', user.name);
      }
      
      // Clear any old token formats
      localStorage.removeItem('token');
      
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  }

  static clearAuthData() {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear all possible token formats
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('profilePhoto');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  static updateToken(newAccessToken) {
    if (typeof window === 'undefined') return false;
    
    if (!this.isValidTokenFormat(newAccessToken)) {
      console.error('Invalid new token format');
      return false;
    }
    
    try {
      localStorage.setItem('accessToken', newAccessToken);
      return true;
    } catch (error) {
      console.error('Error updating token:', error);
      return false;
    }
  }

  // Validate JWT token format (basic validation)
  static isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Each part should be a valid base64 string
    try {
      parts.forEach(part => {
        if (part && part.length > 0) {
          // Try to decode base64
          atob(part.replace(/-/g, '+').replace(/_/g, '/'));
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if token is expired (client-side check)
  static isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  // Get token expiration time
  static getTokenExpiration(token) {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  // Clean up expired tokens
  static cleanupExpiredTokens() {
    const token = this.getToken();
    if (token && this.isTokenExpired(token)) {
      console.log('Token expired, clearing auth data');
      this.clearAuthData();
      return true;
    }
    return false;
  }
}

// Export convenience functions
export const getToken = () => AuthManager.getToken();
export const getRefreshToken = () => AuthManager.getRefreshToken();
export const getUser = () => AuthManager.getUser();
export const isAuthenticated = () => AuthManager.isAuthenticated();
export const setAuthData = (accessToken, refreshToken, user) => AuthManager.setAuthData(accessToken, refreshToken, user);
export const clearAuthData = () => AuthManager.clearAuthData();
export const updateToken = (newAccessToken) => AuthManager.updateToken(newAccessToken);
export const isValidTokenFormat = (token) => AuthManager.isValidTokenFormat(token);
export const isTokenExpired = (token) => AuthManager.isTokenExpired(token);
export const cleanupExpiredTokens = () => AuthManager.cleanupExpiredTokens();

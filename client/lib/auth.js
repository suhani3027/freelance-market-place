// Centralized authentication utility
export class AuthManager {
  static getToken() {
    if (typeof window === 'undefined') return null;
    
    // Try accessToken first (new format), then token (old format)
    const accessToken = localStorage.getItem('accessToken');
    const oldToken = localStorage.getItem('token');
    
    if (accessToken) {
      return accessToken;
    }
    
    if (oldToken) {
      // Migrate old token to new format
      localStorage.setItem('accessToken', oldToken);
      localStorage.removeItem('token');
      console.log('🔄 Migrated old token format to new format');
      return oldToken;
    }
    
    return null;
  }

  static getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
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
    return this.getToken() !== null && this.getUser() !== null;
  }

  static setAuthData(accessToken, refreshToken, user) {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('email', user.email);
    localStorage.setItem('role', user.role);
    if (user.name) {
      localStorage.setItem('name', user.name);
    }
    
    // Clear old token format
    localStorage.removeItem('token');
  }

  static clearAuthData() {
    if (typeof window === 'undefined') return;
    
    // Clear both old and new token formats
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('profilePhoto');
  }

  static updateToken(newAccessToken) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', newAccessToken);
  }

  static migrateOldToken() {
    if (typeof window === 'undefined') return false;
    
    const oldToken = localStorage.getItem('token');
    if (oldToken) {
      localStorage.setItem('accessToken', oldToken);
      localStorage.removeItem('token');
      console.log('🔄 Migrated old token format to new format');
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
export const migrateOldToken = () => AuthManager.migrateOldToken();

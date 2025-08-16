'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '../../lib/api';
import { getToken, getUser } from '../../lib/auth';

interface MessageButtonProps {
  recipientEmail: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const MessageButton = ({ 
  recipientEmail, 
  className = '', 
  variant = 'primary',
  size = 'md',
  showIcon = true 
}: MessageButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnectionStatus();
  }, [recipientEmail]);

  const checkConnectionStatus = async () => {
    try {
      const token = getToken();
      const currentUser = getUser();
      
      if (!token || !currentUser) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      // Don't show message button for yourself
      if (currentUser.email === recipientEmail) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/connections/status/${encodeURIComponent(recipientEmail)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.status === 'accepted');
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection status for message button:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white hover:from-slate-600 hover:to-slate-700 focus:ring-slate-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 bg-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconClasses = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Only show message button if users are connected
  if (!isConnected) {
    return null;
  }

  return (
    <Link
      href={`/messages?user=${encodeURIComponent(recipientEmail)}`}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showIcon && (
        <svg 
          className={`${iconClasses[size]} mr-2 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
      )}
      Message
    </Link>
  );
};

export default MessageButton;

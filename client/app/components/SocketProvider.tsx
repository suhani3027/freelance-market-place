"use client";

import { useEffect, createContext, useContext, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { getToken, getUser, isValidTokenFormat } from '../../lib/auth.js';
import { API_BASE_URL } from '../../lib/api.js';

interface SocketContextType {
  isConnected: boolean;
  notifications: any[];
  addNotification: (notification: any) => void;
  unreadMessageCount: number;
  unreadNotificationCount: number;
  updateUnreadCounts: () => void;
  sendTypingIndicator: (recipientEmail: string, isTyping: boolean) => void;
  typingUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  notifications: [],
  addNotification: () => {},
  unreadMessageCount: 0,
  unreadNotificationCount: 0,
  updateUnreadCounts: () => {},
  sendTypingIndicator: () => {},
  typingUsers: new Set(),
});

export const useSocket = () => useContext(SocketContext);

// Enhanced Toast Notification Component
const ToastNotification = ({ notification, onClose }: { notification: any; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'order':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-500';
      case 'order':
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 max-w-sm animate-slide-in">
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-8 h-8 ${getBgColor(notification.type)} rounded-full flex items-center justify-center`}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
          <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
          <p className="text-xs text-slate-400 mt-2">
            {new Date(notification.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = getToken() || localStorage.getItem('token');
      if (!token) {
        console.log('No valid token available for fetching unread counts');
        return;
      }

      // Fetch unread message count
      const messageResponse = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (messageResponse.ok) {
        const messageData = await messageResponse.json();
        setUnreadMessageCount(messageData.count || 0);
      } else {
        console.warn('Failed to fetch unread message count:', messageResponse.status);
      }

      // Fetch unread notification count
      const notificationResponse = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        setUnreadNotificationCount(notificationData.count || 0);
      } else {
        console.warn('Failed to fetch unread notification count:', notificationResponse.status);
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
      // Don't throw error, just log it to avoid breaking the component
    }
  }, []);

  const sendTypingIndicator = useCallback((recipientEmail: string, isTyping: boolean) => {
    const socket = getSocket();
    if (socket && isConnected) {
      const userEmail = getUser()?.email || localStorage.getItem('email');
      if (userEmail) {
        socket.emit('typing', {
          senderEmail: userEmail,
          recipientEmail,
          isTyping
        });
      }
    }
  }, [isConnected]);

  useEffect(() => {
    const socket = getSocket();
    
    // Connect to socket
    socket.connect();

    // Socket event listeners
    socket.on('connect', () => {
      setIsConnected(true);
      
      // Join user's room for notifications
      const token = getToken();
      const userData = getUser();
      
      // Also check for legacy token format
      const legacyToken = localStorage.getItem('token');
      const legacyEmail = localStorage.getItem('email');
      const legacyRole = localStorage.getItem('role');
      
      if (token && userData && isValidTokenFormat(token)) {
        socket.emit('join', { userId: userData.email, room: userData.email });
        // Fetch initial unread counts
        fetchUnreadCounts();
      } else if (legacyToken && legacyEmail && legacyRole) {
        socket.emit('join', { userId: legacyEmail, room: legacyEmail });
        // Fetch initial unread counts
        fetchUnreadCounts();
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for new notifications
    socket.on('notification', (data) => {
      if (data.type === 'new') {
        setNotifications(prev => [data.notification, ...prev]);
        
        // Show toast for message notifications
        if (data.notification.type === 'message') {
          const toastId = Date.now();
          setToasts(prev => [...prev, { ...data.notification, id: toastId }]);
          // Increment unread message count
          setUnreadMessageCount(prev => prev + 1);
        } else {
          // Increment unread notification count
          setUnreadNotificationCount(prev => prev + 1);
        }
      }
    });

    // Listen for new messages
    socket.on('newMessage', () => {
      setUnreadMessageCount(prev => prev + 1);
    });

    // Listen for typing indicators
    socket.on('userTyping', (data) => {
      const userData = getUser();
      if (userData && data.recipientEmail === userData.email) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set(prev).add(data.senderEmail));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.senderEmail);
            return newSet;
          });
        }
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [fetchUnreadCounts]);

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const removeToast = (toastId: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const updateUnreadCounts = () => {
    fetchUnreadCounts();
  };

  return (
    <SocketContext.Provider value={{ 
      isConnected, 
      notifications, 
      addNotification, 
      unreadMessageCount, 
      unreadNotificationCount,
      updateUnreadCounts,
      sendTypingIndicator,
      typingUsers
    }}>
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            notification={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </SocketContext.Provider>
  );
}

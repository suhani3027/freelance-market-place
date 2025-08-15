"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { useSocket } from '../components/SocketProvider';

export default function Notifications() {
  const { updateUnreadCounts } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Update unread counts when page loads
    updateUnreadCounts();
  }, [page, updateUnreadCounts]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.notifications || []);
        if (page === 1) setNotifications(list); else setNotifications(prev => [...prev, ...list]);
        const totalPages = data.totalPages ?? (list.length === 20 ? page + 1 : page);
        setHasMore(page < totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        // Update unread counts after marking as read
        updateUnreadCounts();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        // Update unread counts after marking all as read
        updateUnreadCounts();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
        // Update unread counts after deleting
        updateUnreadCounts();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read first
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Get user role from localStorage
    const userRole = localStorage.getItem('role');

    // Navigate based on notification type
    switch (notification.type) {
      case 'gig_proposal':
        // Navigate to client proposals page
        if (userRole === 'client') {
          window.location.href = '/clients/proposals';
        }
        break;
      case 'connection_request':
        // Navigate to connections page
        break;
      case 'message':
        // Navigate to messages page
        window.location.href = '/messages';
        break;
      case 'gig_accepted':
      case 'gig_rejected':
        // Navigate to freelancer proposals page
        if (userRole === 'freelancer') {
          window.location.href = '/freelancer/proposals';
        }
        break;
      default:
        // For other types, just mark as read
        break;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                  notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {hasMore && (
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Load More
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
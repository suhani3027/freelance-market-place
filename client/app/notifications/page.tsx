"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'client-token' || token === 'freelancer-token' || !token.startsWith('eyJ')) {
        setError('Please log in to view notifications');
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:5000/api/notifications?page=${page}&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        setHasMore(data.currentPage < data.totalPages);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      }
    } catch (err) {
      console.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
      case 'connection_rejected':
        if (notification.sender.email) {
          router.push(`/freelancer/profile?email=${encodeURIComponent(notification.sender.email)}`);
        }
        break;
      case 'gig_proposal':
        if (notification.relatedId) {
          router.push(`/gigs?search=${encodeURIComponent('proposal')}`);
        }
        break;
      case 'message':
        if (notification.sender.email) {
          router.push(`/messages?user=${encodeURIComponent(notification.sender.email)}`);
        }
        break;
      case 'gig_created':
      case 'gig_updated':
        if (notification.relatedId) {
          router.push(`/gigs?search=${encodeURIComponent('gig')}`);
        }
        break;
      case 'profile_review':
        if (notification.sender.email) {
          router.push(`/clients/profile/${encodeURIComponent(notification.sender.email)}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return '👥';
      case 'connection_accepted':
        return '✅';
      case 'connection_rejected':
        return '❌';
      case 'gig_proposal':
        return '💼';
      case 'message':
        return '💬';
      case 'gig_created':
      case 'gig_updated':
        return '📝';
      case 'profile_review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && page === 1) {
    return <div className="flex justify-center items-center h-64">Loading notifications...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <div className="text-6xl mb-4">🔔</div>
          <p className="text-xl mb-2">No notifications yet</p>
          <p>You'll see notifications here when you receive connection requests, messages, and other updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                notification.read 
                  ? 'bg-white border-gray-200' 
                  : 'bg-blue-50 border-blue-200'
              } hover:bg-gray-50`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{getTimeAgo(notification.createdAt)}</span>
                      <span>from {notification.sender.name || notification.sender.email.split('@')[0]}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 
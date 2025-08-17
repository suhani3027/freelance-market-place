'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';
import { getToken, getUser } from '../../lib/auth';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
  category: string;
  priority: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: any[];
  categories: {
    proposal: number;
    payment: number;
    message: number;
    gig: number;
    order: number;
    system: number;
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'proposal' | 'payment' | 'message' | 'gig' | 'order'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [activeTab, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;

      let url = `${API_BASE_URL}/api/notifications?limit=20&offset=${(page - 1) * 20}`;
      
      if (activeTab === 'unread') {
        url += '&unreadOnly=true';
      } else if (activeTab !== 'all') {
        url += `&category=${activeTab}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        setHasMore(data.notifications.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingRead(notificationId);
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on action
    if (notification.data?.action) {
      switch (notification.data.action) {
        case 'view_proposals':
          router.push('/clients/proposals');
          break;
        case 'view_orders':
          router.push('/orders');
          break;
        case 'view_messages':
          router.push('/messages');
          break;
        case 'view_gig':
          if (notification.data.gigId) {
            router.push(`/gigs/${notification.data.gigId}`);
          }
          break;
        case 'view_earnings':
          router.push('/dashboard');
          break;
        case 'view_reviews':
          router.push('/dashboard');
          break;
        case 'view_project':
          if (notification.data.gigId) {
            router.push(`/gigs/${notification.data.gigId}`);
          }
          break;
        default:
          break;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_proposal':
        return '📝';
      case 'proposal_accepted':
        return '✅';
      case 'proposal_rejected':
        return '❌';
      case 'gig_completed':
        return '🎉';
      case 'payment_received':
        return '💰';
      case 'new_message':
        return '💬';
      case 'order_created':
        return '📋';
      case 'order_status_updated':
        return '🔄';
      case 'new_gig':
        return '🆕';
      case 'gig_updated':
        return '✏️';
      case 'review_received':
        return '⭐';
      case 'milestone_reached':
        return '🏆';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      case 'low':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'proposal':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      case 'gig':
        return 'bg-yellow-100 text-yellow-800';
      case 'order':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const resetPage = () => {
    setPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    resetPage();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with all your activities and updates</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">{stats.categories.proposal}</div>
              <div className="text-sm text-gray-600">Proposals</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-green-600">{stats.categories.payment}</div>
              <div className="text-sm text-gray-600">Payments</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">{stats.categories.message}</div>
              <div className="text-sm text-gray-600">Messages</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-yellow-600">{stats.categories.gig}</div>
              <div className="text-sm text-gray-600">Gigs</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-indigo-600">{stats.categories.order}</div>
              <div className="text-sm text-gray-600">Orders</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['all', 'unread', 'proposal', 'payment', 'message', 'gig', 'order'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {stats && stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading && page === 1 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-xl mb-2">No notifications</p>
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                          {notification.category}
                        </span>
                        {notification.priority !== 'medium' && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.data?.sender && (
                            <span>From: {notification.data.sender}</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              disabled={markingRead === notification._id}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {markingRead === notification._id ? 'Marking...' : 'Mark Read'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            View
                          </button>
                          
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="p-6 text-center border-t border-gray-100">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 
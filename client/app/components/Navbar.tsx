'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function Navbar() {
  const [isAuth, setIsAuth] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [searchType, setSearchType] = useState<'talent' | 'jobs' | 'projects'>('talent');
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Use configured API base URL everywhere
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) {
      router.push(`/gigs?search=${encodeURIComponent(search)}`);
    } else {
      router.push('/gigs');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const value = e.target.value;
        if (value.trim() === '') {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }
    if (searchType === 'talent') {
      searchTimeout.current = setTimeout(async () => {
                 try {
           const res = await fetch(`${apiUrl}/api/users/search?q=${encodeURIComponent(value)}`);
           if (res.ok) {
             const data = await res.json();

             setSearchResults(data);
             setSearchDropdownOpen(true);
           } else {
             setSearchResults([]);
             setSearchDropdownOpen(false);
           }
         } catch {
           setSearchResults([]);
           setSearchDropdownOpen(false);
         }
      }, 300);
    } else {
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`${apiUrl}/api/gigs?search=${encodeURIComponent(value)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
            setSearchDropdownOpen(true);
          } else {
            setSearchResults([]);
            setSearchDropdownOpen(false);
          }
        } catch {
          setSearchResults([]);
          setSearchDropdownOpen(false);
        }
      }, 300);
    }
  };

  const handleResultClick = (item: any) => {
    setSearch('');
    setSearchResults([]);
    setSearchDropdownOpen(false);
    if (searchType === 'talent') {

      if (item.role === 'client') {
        router.push(`/clients/profile/${encodeURIComponent(item.email)}`);
      } else {
        router.push(`/freelancer/profile?email=${encodeURIComponent(item.email)}`);
      }
    } else {
      router.push(`/gigs/${item._id}`);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationDropdownOpen(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setMessageDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notification and message counts
  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      if (!isMounted) return;
      const token = localStorage.getItem('token');

      // Only proceed if we have a valid JWT token (not hardcoded tokens)
      if (!token || token === 'client-token' || token === 'freelancer-token' || !token.startsWith('eyJ')) {
        return;
      }

      try {
        // If API is down, bail out quietly to avoid noisy overlay in dev
        const ping = await fetch(`${apiUrl}/api/users`, { method: 'HEAD' }).catch(() => null);
        if (!ping) return;
        // Fetch notification count
        const notificationRes = await fetch(`${apiUrl}/api/notifications/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (notificationRes.ok) {
          const notificationData = await notificationRes.json();
          setNotificationCount(notificationData.count);
        }

        // Fetch message count
        const messageRes = await fetch(`${apiUrl}/api/messages/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (messageRes.ok) {
          const messageData = await messageRes.json();

           const connectionIds = messageData.map((conv: any) => conv.connectionId);
           const duplicates = connectionIds.filter((id: string, index: number) => connectionIds.indexOf(id) !== index);
           if (duplicates.length > 0) {
             // Remove duplicates before setting state
             const uniqueConversations = messageData.filter((conv: any, index: number) => 
               connectionIds.indexOf(conv.connectionId) === index
             );
             const totalUnread = uniqueConversations.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
             setMessageCount(totalUnread);
             setConversations(uniqueConversations);
           } else {
             const totalUnread = messageData.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0);
             setMessageCount(totalUnread);
             setConversations(messageData);
           }
        }

        // Fetch recent notifications
        const recentNotificationsRes = await fetch(`${apiUrl}/api/notifications?page=1&limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (recentNotificationsRes.ok) {
          const notificationsData = await recentNotificationsRes.json();
          setNotifications(notificationsData.notifications);
        }
      } catch (error) {
        // Silently handle API errors
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // Changed from 30s to 60s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Socket.io connection and payment notification handling
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('email');
    
    if (!token || !userEmail) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initialize Socket.io connection
    const socketInstance = io(apiUrl, {
      auth: {
        token: token
      }
    });

    socketInstance.on('connect', () => {
      // Connected to Socket.io server
    });

    socketInstance.on('disconnect', () => {
      // Disconnected from Socket.io server
    });

    // Handle payment notifications
    socketInstance.on('paymentNotification', (data) => {
      if (data.recipient === userEmail) {
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico'
          });
        }

        // Update notification count and add to notifications list
        setNotificationCount(prev => prev + 1);
        setNotifications(prev => [{
          _id: Date.now().toString(),
          title: data.title,
          message: data.message,
          type: data.type,
          createdAt: new Date().toISOString(),
          isRead: false
        }, ...prev]);

        // Show toast notification
        alert(`🎉 ${data.title}\n${data.message}`);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [apiUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const userName = localStorage.getItem('name');
      const userPhoto = localStorage.getItem('profilePhoto');

      // Only consider valid JWT tokens as authenticated
      if (token && token !== 'client-token' && token !== 'freelancer-token' && token.startsWith('eyJ')) {
        setIsAuth(true);
        setIsClient(role === 'client');
        setIsFreelancer(role === 'freelancer');
        setName(userName || '');
        setProfilePhoto(userPhoto || '');
      } else {
        setIsAuth(false);
        setIsClient(false);
        setIsFreelancer(false);
        setName('');
        setProfilePhoto('');
      }
    }
  }, [pathname]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-blue-600 font-bold text-xl">TaskNest</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="What service are you looking for today?"
                value={search}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {searchDropdownOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchType === 'talent' ? (
                    searchResults.map((user, idx) => (
                      <div
                        key={user.email + idx}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                        onClick={() => handleResultClick(user)}
                      >
                                                 <span className="font-semibold">
                           {user.name || user.fullName}
                           {user.companyName && <span className="text-xs text-gray-500">({user.companyName})</span>}
                           {user.title && <span className="text-xs text-gray-500"> - {user.title}</span>}
                         </span>
                         <span className="text-xs text-gray-500">
                           {user.email} • {user.role === 'client' ? '👔 Client' : '👨‍💻 Freelancer'}
                           {user.userType === 'completed_profile' && <span className="text-green-600"> ✓ Complete Profile</span>}
                         </span>
                      </div>
                    ))
                  ) : (
                    searchResults.map((gig, idx) => (
                      <div
                        key={gig._id + idx}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleResultClick(gig)}
                      >
                        <span className="font-semibold">{gig.title}</span>
                        <span className="text-xs text-gray-500 block">₹{gig.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
          
            <Link href="/explore" className="text-gray-700 hover:text-blue-600 font-medium">
              Explore
            </Link>
            
            {/* Role-specific navigation */}
            {isClient && (
              <>
                <Link href="/my-gigs" className="text-gray-700 hover:text-blue-600 font-medium">
                  My Gigs
                </Link>
                <Link href="/freelancer/proposals" className="text-gray-700 hover:text-blue-600 font-medium">
                  Proposals
                </Link>
              </>
            )}
            
            {isFreelancer && (
              <>
                <Link href="/gigs" className="text-gray-700 hover:text-blue-600 font-medium">
                  Available Gigs
                </Link>
                <Link href="/freelancer/profile/proposals" className="text-gray-700 hover:text-blue-600 font-medium">
                  My Proposals
                </Link>
              </>
            )}
            
            
            <Link href="/register" className="text-gray-700 hover:text-blue-600 font-medium">
              Become a Seller
            </Link>
            
            {/* Notification Icon */}
            {(isClient || isFreelancer) && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 00-6 6v3.75a6 6 0 006 6h3a6 6 0 006-6V9.75a6 6 0 00-6-6h-3z" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
                
                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No notifications</div>
                    ) : (
                      <div>
                                                 {notifications.slice(0, 5).map((notification, index) => (
                           <div
                             key={notification._id}
                            className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setNotificationDropdownOpen(false);
                              router.push('/notifications');
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-600">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.createdAt)}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div className="p-3 text-center">
                          <Link
                            href="/notifications"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onClick={() => setNotificationDropdownOpen(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message Icon */}
            {(isClient || isFreelancer) && (
              <div className="relative" ref={messageRef}>
                <button
                  onClick={() => setMessageDropdownOpen(!messageDropdownOpen)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {messageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {messageCount > 99 ? '99+' : messageCount}
                    </span>
                  )}
                </button>
                
                {messageDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Messages</h3>
                    </div>
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No messages</div>
                    ) : (
                      <div>
                                                 {conversations.slice(0, 5).map((conversation, index) => (
                           <div
                             key={conversation.connectionId}
                            className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setMessageDropdownOpen(false);
                              router.push(`/messages?user=${encodeURIComponent(conversation.otherUser.email)}`);
                            }}
                          >
                            <div className="flex items-start space-x-2">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {conversation.otherUser.name?.charAt(0) || conversation.otherUser.email.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {conversation.otherUser.name || conversation.otherUser.email.split('@')[0]}
                                </p>
                                {conversation.latestMessage && (
                                  <p className="text-xs text-gray-600 truncate">
                                    {conversation.latestMessage.content}
                                  </p>
                                )}
                                {conversation.unreadCount > 0 && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    {conversation.unreadCount} new message{conversation.unreadCount > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="p-3 text-center">
                          <Link
                            href="/messages"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onClick={() => setMessageDropdownOpen(false)}
                          >
                            View all messages
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Profile/Login Section */}
            {(isClient || isFreelancer) ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => setDropdownOpen(v => !v)}
                >
                  {profilePhoto && profilePhoto.trim() !== '' ? (
                    <img src={profilePhoto} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png" alt="Default Profile" className="w-9 h-9 rounded-full object-cover" />
                  )}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg z-50 p-4">
                    <div className="flex flex-col items-center mb-4">
                      {profilePhoto && profilePhoto.trim() !== '' ? (
                        <img src={profilePhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover mb-2" />
                      ) : (
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png" alt="Default Profile" className="w-16 h-16 rounded-full object-cover mb-2" />
                      )}
                      <div className="font-semibold text-lg">{name || 'User'}</div>
                      <div className="text-gray-500 text-sm mb-2">{isClient ? 'Client' : 'Freelancer'}</div>
                      <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                        Online for messages
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mb-2">
                      <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { 
                        const userEmail = localStorage.getItem('email');
                        router.push(`/freelancer/profile?email=${encodeURIComponent(userEmail || '')}`);
                        setDropdownOpen(false); 
                      }}>
                        <span className="material-icons"></span> Your profile
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/messages'); setDropdownOpen(false); }}>
                        <span className="material-icons">💬</span> Messages
                      </button>
                      {isFreelancer && (
                        <>
                          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/freelancer/profile/proposals'); setDropdownOpen(false); }}>
                            <span className="material-icons"></span> My Proposals
                          </button>
                        </>
                      )}
                      {isClient && (
                        <>
                          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/my-gigs'); setDropdownOpen(false); }}>
                            <span className="material-icons"></span> My Gigs
                          </button>
                          <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/freelancer/proposals'); setDropdownOpen(false); }}>
                            <span className="material-icons"></span> Proposals
                          </button>
                        </>
                      )}

                      <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/gigs/new'); setDropdownOpen(false); }}>
                            <span className="material-icons"></span> Create Gig
                          </button>
                    </div>
                    <button
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 text-red-600 font-semibold mt-2"
                      onClick={() => {
                        localStorage.clear();
                        setDropdownOpen(false);
                        setIsAuth(false);
                        setIsClient(false);
                        setIsFreelancer(false);
                        setName('');
                        setProfilePhoto('');
                        localStorage.removeItem('profileComplete');
                        router.push('/');
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <span className="text-gray-700 hover:text-blue-600 cursor-pointer">Log in</span>
                </Link>
                <Link href="/register">
                  <button className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700">
                    Sign up
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
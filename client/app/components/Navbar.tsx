'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';
import { useSocket } from './SocketProvider';

export default function Navbar() {
  const router = useRouter();
  const { 
    notifications, 
    unreadMessageCount, 
    unreadNotificationCount, 
    updateUnreadCounts 
  } = useSocket();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'people' | 'gigs'>('gigs');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchUserData();
    // Update unread counts periodically
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        updateUnreadCounts();
        const interval = setInterval(updateUnreadCounts, 30000);
        return () => clearInterval(interval);
      }
    }
  }, [updateUnreadCounts]);

  // Close dropdown on outside click or route change
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const fetchUserData = async () => {
    try {
      // Only access localStorage on the client side
      if (typeof window === 'undefined') return;
      
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');

      if (!email || !token) {
        setLoading(false);
        return;
      }

      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/user/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        }
      } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  const goToMyProfile = () => {
    if (!user || typeof window === 'undefined') return;
    const role = (user.role || localStorage.getItem('role')) as string;
    if (role === 'freelancer') {
      router.push('/freelancer/profile');
    } else {
      router.push('/clients/profile');
    }
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const searchQuery = encodeURIComponent(searchTerm.trim());
      router.push(`/search?q=${searchQuery}&type=${searchType}`);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-blue-600">
              TaskNest
            </Link>
          </div>

          {/* Search bar centered between brand and main links */}
          <form onSubmit={submitSearch} className="flex-1 hidden md:flex items-center gap-2 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search gigs or people..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                {/* search icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-2-2"/></svg>
              </span>
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'people' | 'gigs')}
              className="border border-gray-300 rounded-lg px-2 py-2"
            >
              <option value="gigs">Gigs</option>
              <option value="people">People</option>
            </select>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          {/* Main links and user actions */}
          <div className="flex items-center gap-4">
            <Link href="/orders" className="text-gray-700 hover:text-blue-600">
              Orders
            </Link>
            
            {/* Show loading state while fetching user data */}
            {loading && (
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            )}
            
            {/* Only render navigation items after component has mounted and user data is loaded to prevent hydration mismatch */}
            {mounted && !loading && (
              <>
                {user?.role === 'freelancer' && (
                  <Link href="/gigs" className="text-gray-700 hover:text-blue-600">
                    Gigs
                  </Link>
                )}

                {user ? (
                  <>
                    <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
                    {user.role === 'client' && (
                      <>
                        <Link href="/my-gigs" className="text-gray-700 hover:text-blue-600">My Gigs</Link>
                        <Link href="/clients/proposals" className="text-gray-700 hover:text-blue-600">Proposals</Link>
                      </>
                    )}
                    {user.role === 'freelancer' && (
                      <Link href="/freelancer/proposals" className="text-gray-700 hover:text-blue-600">My Proposals</Link>
                    )}

                    {/* Messages with count bubble */}
                    <Link
                      href="/messages"
                      className="relative text-gray-700 hover:text-blue-600"
                      title="Messages"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                        </span>
                      )}
                    </Link>

                    {/* Notifications with count bubble */}
                    <button
                      onClick={() => router.push('/notifications')}
                      className="relative text-gray-700 hover:text-blue-600"
                      title="Notifications"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                      </svg>
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1 min-w-[18px] h-[18px] flex items-center justify-center">
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </button>

                    {/* Profile menu */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setMenuOpen((o) => !o)}
                        title="Account"
                        className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        {user.profilePhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-white font-semibold ${
                            ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'][Math.abs(String(user.name || user.email || '?').charCodeAt(0)) % 6]
                          }`}>
                            {String(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              goToMyProfile();
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => { setMenuOpen(false); router.push('/messages'); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            Messages
                            {unreadMessageCount > 0 && (
                              <span className="ml-2 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">
                                {unreadMessageCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => { setMenuOpen(false); router.push('/notifications'); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                          >
                            Notifications
                            {unreadNotificationCount > 0 && (
                              <span className="ml-2 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">
                                {unreadNotificationCount}
                              </span>
                            )}
                          </button>
                          {user.role === 'client' && (
                            <>
                              <button
                                onClick={() => { setMenuOpen(false); router.push('/my-gigs'); }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                              >
                                My Gigs
                              </button>
                              <button
                                onClick={() => { setMenuOpen(false); router.push('/clients/proposals'); }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                              >
                                View Proposals
                              </button>
                            </>
                          )}
                          {user.role === 'freelancer' && (
                            <button
                              onClick={() => { setMenuOpen(false); router.push('/freelancer/proposals'); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                            >
                              My Proposals
                            </button>
                          )}
                          <div className="my-1 border-t border-gray-100" />
                          <button
                            onClick={() => { setMenuOpen(false); handleLogout(); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
                    <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Sign up</Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {/* Secondary categories bar */}
        <div className="hidden md:flex items-center gap-6 h-10 text-sm text-gray-700 border-t border-gray-100">
          {[
            'Graphics & Design',
            'Digital Marketing',
            'Writing & Translation',
            'Video & Animation',
            'Music & Audio',
            'Programming & Tech',
            'Business',
            'Lifestyle',
            'Data',
            'Photography',
          ].map((label) => (
            <Link
              key={label}
              href={`/category/${encodeURIComponent(label.toLowerCase().replace(/\s+/g, '-'))}`}
              className="py-2 hover:text-blue-600 whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 
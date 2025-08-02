'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [isAuth, setIsAuth] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [name, setName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [searchType, setSearchType] = useState<'talent' | 'jobs' | 'projects'>('talent');

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
          const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(value)}`);
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
      // Jobs or Projects: search gigs
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/gigs?search=${encodeURIComponent(value)}`);
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

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const profileComplete = localStorage.getItem('profileComplete') === 'true';
      setIsAuth(!!(token || role));
      setIsClient(role === 'client');
      setIsFreelancer(role === 'freelancer' && profileComplete);
      setName(localStorage.getItem('name') || '');
      setProfilePhoto(localStorage.getItem('profilePhoto') || '');
    }
  }, [pathname]);

  

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <nav className="flex items-center justify-between w-full px-6 py-3 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-2xl font-bold text-black">TaskNest</span>
      </div>
      <div className="flex items-center gap-8 ml-auto">
        <Link href="/messages" className="text-gray-700 hover:text-green-600 font-medium">
          Messages
        </Link>
        {/* Global search bar with dropdown inside */}
        <div className="relative" style={{ minWidth: 350 }}>
          <form onSubmit={handleSearch} className="flex items-center border rounded-2xl bg-white px-4 py-1 shadow-sm w-full">
            <span className="mr-2 text-gray-500">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-2-2"/></svg>
            </span>
            <select
              className="bg-transparent text-gray-700 outline-none px-2 py-1 rounded-xl border-none font-semibold"
              value={searchType}
              onChange={e => setSearchType(e.target.value as any)}
              style={{ minWidth: 120 }}
            >
              <option value="talent">Talent / Clients</option>
              <option value="jobs">Jobs</option>
              <option value="projects">Projects</option>
            </select>
            <input
              type="text"
              className="bg-transparent outline-none flex-1 text-gray-700 px-2 py-2"
              placeholder={searchType === 'talent' ? 'Search talent, clients...' : searchType === 'jobs' ? 'Search jobs...' : 'Search projects...'}
              value={search}
              onChange={handleSearchChange}
              onFocus={() => { if (searchResults.length > 0) setSearchDropdownOpen(true); }}
              autoComplete="off"
            />
          </form>
          {searchDropdownOpen && (
            <div className="absolute left-0 mt-2 w-full bg-white border rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-2 text-gray-500">No results found</div>
              ) : searchType === 'talent' ? (
                searchResults.map((user, idx) => (
                  <div
                    key={user.email + idx}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                    onClick={() => handleResultClick(user)}
                  >
                    <span className="font-semibold">{user.name} {user.companyName && <span className="text-xs text-gray-500">({user.companyName})</span>}</span>
                    <span className="text-xs text-gray-500">{user.email} • {user.role === 'client' ? 'Client' : 'Freelancer'}</span>
                  </div>
                ))
              ) : (
                searchResults.map((gig, idx) => (
                  <div
                    key={gig._id + idx}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                    onClick={() => handleResultClick(gig)}
                  >
                    <span className="font-semibold">{gig.title}</span>
                    {gig.amount !== undefined && <span className="text-xs text-gray-500">${gig.amount}</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
                  <div className="font-semibold text-lg">{name || 'Freelancer'}</div>
                  <div className="text-gray-500 text-sm mb-2">{isClient ? 'Client' : 'Freelancer'}</div>
                  <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                    Online for messages
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/freelancer/profile'); setDropdownOpen(false); }}>
                    <span className="material-icons"></span> Your profile
                  </button>
                  {isFreelancer && (
                    <button className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 w-full text-left" onClick={() => { router.push('/freelancer/profile/proposals'); setDropdownOpen(false); }}>
                      <span className="material-icons"></span> My Proposals
                    </button>
                  )}
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
              <span className="text-black hover:underline cursor-pointer">Log in</span>
            </Link>
            <Link href="/register">
              <button className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700">
                Sign up
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
} 
"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('people');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    if (typeof window !== 'undefined') {
      const userEmail = localStorage.getItem('email');
      const userName = localStorage.getItem('name');
      const userRole = localStorage.getItem('role');
      if (userEmail) {
        setUser({ email: userEmail, name: userName, role: userRole });
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      let res;
      if (searchType === 'people') {
        res = await fetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`);
      } else {
        res = await fetch(`${API_BASE_URL}/api/gigs/search?q=${encodeURIComponent(query)}`);
      }
      
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    // Load recent gigs on component mount
    const loadRecentGigs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/gigs`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.slice(0, 10)); // Show first 10 gigs
        }
      } catch (error) {
        console.error('Failed to load recent gigs:', error);
      }
    };

    loadRecentGigs();
  }, []);

  const loadUserGigs = async (userEmail) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/gigs?clientId=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (error) {
      console.error('Failed to load user gigs:', error);
    }
    return [];
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Explore</h1>
        
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search for people or gigs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="people">People</option>
                <option value="gigs">Gigs</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
            <div key={item._id || item.email} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {searchType === 'people' ? (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={item.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                      alt="Profile"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-gray-600 text-sm">{item.email}</p>
                    </div>
                  </div>
                  {item.companyName && (
                    <p className="text-gray-500 text-sm mb-2">Company: {item.companyName}</p>
                  )}
                  <a
                    href={`/clients/profile/${encodeURIComponent(item.email)}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {item.description?.slice(0, 100)}...
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-semibold">${item.amount}</span>
                    <a
                      href={`/gigs/${item._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Gig →
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found. Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
} 
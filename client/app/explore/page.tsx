"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Gig {
  _id: string;
  title: string;
  technology?: string;
  duration?: string;
  amount?: number;
  description: string;
  clientId?: string;
  createdAt?: string;
  skills?: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  title?: string;
  companyName?: string;
  skills?: string[];
  overview?: string;
  profilePhoto?: string;
  userType?: string;
}

function ExploreContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [recentGigs, setRecentGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<'users' | 'gigs'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userGigs, setUserGigs] = useState<Gig[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.get('q') || "";
    setSearchQuery(query);
    if (query) {
      if (searchType === 'users') {
      searchUsers(query);
      } else {
        searchGigs(query);
      }
    } else {
      // Load recent gigs when no search query
      loadRecentGigs();
    }
  }, [searchParams, searchType]);

  // Load recent gigs on component mount
  useEffect(() => {
    if (!searchQuery) {
      loadRecentGigs();
    }
  }, []);

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error("Error searching users:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchGigs = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/gigs/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setGigs(data);
      } else {
        console.error("Error searching gigs:", res.status, res.statusText);
      }
    } catch (error) {
      console.error("Error searching gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentGigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/gigs');
      if (res.ok) {
        const data = await res.json();
        setRecentGigs(data.slice(0, 6)); // Show only 6 recent gigs
      }
    } catch (error) {
      console.error("Error loading recent gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchType === 'users') {
      searchUsers(searchQuery);
      } else {
        searchGigs(searchQuery);
      }
    }
  };

  const handleUserClick = async (user: User) => {
    setSelectedUser(user);
    setShowProfile(true);
    
    // Fetch user's gigs
    try {
      const res = await fetch(`http://localhost:5000/api/gigs?clientId=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setUserGigs(data);
      }
    } catch (error) {
      console.error("Error fetching user gigs:", error);
    }
  };

  const handleBackToSearch = () => {
    setShowProfile(false);
    setSelectedUser(null);
    setUserGigs([]);
  };

  if (showProfile && selectedUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleBackToSearch}
                  className="text-gray-600 hover:text-gray-900 mr-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={selectedUser.profilePhoto || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                    alt={selectedUser.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white"
                  />
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="ml-6">
                  <h1 className="text-3xl font-bold">{selectedUser.name}</h1>
                  <p className="text-lg opacity-90">{selectedUser.email}</p>
                  {selectedUser.title && (
                    <p className="text-lg opacity-90 mt-1">{selectedUser.title}</p>
                  )}
                  {selectedUser.companyName && (
                    <p className="text-lg opacity-90">{selectedUser.companyName}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    + Connect
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              {/* Role Badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedUser.role === 'freelancer' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {selectedUser.role === 'freelancer' ? 'Freelancer' : 'Client'}
                </span>
                {selectedUser.userType === 'completed_profile' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 ml-2">
                    Complete Profile
                  </span>
                )}
              </div>

              {/* Overview */}
              {selectedUser.overview && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedUser.overview}</p>
                </div>
              )}

              {/* Skills */}
              {selectedUser.skills && selectedUser.skills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gigs Posted */}
              {userGigs.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gigs Posted</h3>
                  <div className="space-y-4">
                    {userGigs.map((gig) => (
                      <div key={gig._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/gigs/${gig._id}`} className="block hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors">
                              <h4 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                                {gig.title}
                              </h4>
                            </Link>
                            <p className="text-gray-600 mb-3">{gig.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <span className="font-semibold text-green-600">${gig.amount}</span>
                              <span>{gig.duration}</span>
                              {gig.technology && <span>{gig.technology}</span>}
                            </div>
                            {gig.skills && gig.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {gig.skills.slice(0, 3).map((skill: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {gig.skills.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                    +{gig.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              Posted {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString() : 'Recently'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link
                              href={`/gigs/${gig._id}`}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              View Gig
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                             {/* Reviews Section */}
               <div className="mb-8">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
                 <div className="text-center py-8 text-gray-500">
                   <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                   </svg>
                   <p>Reviews feature coming soon!</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Talent & Clients</h1>
          <p className="text-gray-600">Connect with freelancers and clients on TaskNest</p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={searchType === 'gigs' ? "Search by gig title, skills, or description..." : "Search by name, skills, or company..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSearchType('users')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      searchType === 'users' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    People
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType('gigs')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      searchType === 'gigs' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Gigs
                  </button>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : searchQuery ? (
          // Search Results
          searchType === 'users' ? (
            users.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        ) : (
              <div className="space-y-3">
            {users.map((user) => (
                  <div 
                    key={user.email} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="p-4">
                      <div className="flex items-center space-x-4">
                    {/* Profile Picture */}
                        <div className="flex-shrink-0 relative">
                      <img
                        src={user.profilePhoto || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                        alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {user.name}
                            </h3>
                          <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                          
                          {user.title && (
                            <p className="text-gray-700 font-medium mb-1">{user.title}</p>
                          )}
                          
                          {user.companyName && (
                            <p className="text-gray-600 text-sm mb-2">{user.companyName}</p>
                          )}

                          {/* Role Badge */}
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'freelancer' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'freelancer' ? 'Freelancer' : 'Client'}
                            </span>
                            
                            {user.userType === 'completed_profile' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Complete Profile
                              </span>
                            )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="ml-4">
                              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                View Profile
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Gig search results
            gigs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gigs.map((gig) => (
                  <div key={gig._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/gigs/${gig._id}`} className="block hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                              {gig.title}
                            </h3>
                          </Link>
                          
                          <p className="text-gray-600 mb-3">{gig.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span className="font-semibold text-green-600">${gig.amount}</span>
                            <span>{gig.duration}</span>
                            {gig.technology && <span>{gig.technology}</span>}
                          </div>

                          {gig.skills && gig.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {gig.skills.slice(0, 3).map((skill: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {gig.skills.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                  +{gig.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          <div className="text-xs text-gray-400">
                            Posted {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString() : 'Recently'}
                          </div>
                        </div>

                        <div className="ml-4">
                          <Link
                            href={`/gigs/${gig._id}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Details
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        ) : (
          // Recent Gigs Section (when no search query)
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Posted Gigs</h2>
            {recentGigs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gigs posted yet</h3>
                <p className="text-gray-500">Be the first to post a gig!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentGigs.map((gig) => (
                  <div key={gig._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <Link href={`/gigs/${gig._id}`} className="block hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors">
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                          {gig.title}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{gig.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-green-600">${gig.amount}</span>
                        <span className="text-sm text-gray-500">{gig.duration}</span>
                      </div>
                      
                      {gig.skills && gig.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {gig.skills.slice(0, 2).map((skill: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {gig.skills.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                              +{gig.skills.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Posted {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                        <Link
                          href={`/gigs/${gig._id}`}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 

export default function Explore() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
} 
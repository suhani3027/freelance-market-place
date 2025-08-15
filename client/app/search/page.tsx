'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../lib/api';
import Link from 'next/link';
import ConnectionButton from '../components/ConnectionButton';
import MessageButton from '../components/MessageButton';

interface SearchResult {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: string;
  companyName?: string;
  title?: string;
  skills?: string[];
  overview?: string;
  userType: string;
  type: string;
  profilePhoto?: string;
}

interface GigResult {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  amount: number;
  duration: string;
  clientId: string;
  image?: string;
  createdAt: string;
  type: string;
}

interface SearchResults {
  query: string;
  type: string;
  results: {
    people: SearchResult[];
    gigs: GigResult[];
  };
  total: {
    people: number;
    gigs: number;
  };
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'people' | 'gigs'>('all');

  const query = searchParams.get('q');
  const type = searchParams.get('type') as 'people' | 'gigs' | null;

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query, type]);

  const performSearch = async () => {
    if (!query) return;

    setLoading(true);
    setError('');

    try {
      const searchType = type || 'all';
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&type=${searchType}`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setActiveTab(searchType === 'all' ? 'all' : searchType);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Search failed');
      }
    } catch (error) {
      setError('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
      'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for "{query}"...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={performSearch}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-2-2m0 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Query</h3>
            <p className="text-gray-600">Please enter a search term to find people or gigs.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">No results found.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalResults = results.total.people + results.total.gigs;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Results Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Results ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'people'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                People ({results.total.people})
              </button>
              <button
                onClick={() => setActiveTab('gigs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gigs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gigs ({results.total.gigs})
              </button>
            </nav>
          </div>
        </div>

        {/* Results Content */}
        <div className="space-y-6">
          {/* People Results */}
          {(activeTab === 'all' || activeTab === 'people') && results.results.people.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">People</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.results.people.map((person) => (
                  <div key={person.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className={`w-16 h-16 ${getAvatarColor(person.name)} rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                        {person.profilePhoto ? (
                          <img 
                            src={person.profilePhoto} 
                            alt={person.name} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(person.name)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {person.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{person.email}</p>
                        
                        {person.companyName && (
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Company:</span> {person.companyName}
                          </p>
                        )}
                        
                        {person.title && (
                          <p className="text-sm text-gray-700 mb-2">
                            <span className="font-medium">Title:</span> {person.title}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            person.role === 'freelancer' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {person.role === 'freelancer' ? 'Freelancer' : 'Client'}
                          </span>
                          {person.userType === 'completed_profile' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Verified Profile
                            </span>
                          )}
                        </div>
                        
                        {person.skills && person.skills.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {person.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {person.skills.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  +{person.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Link
                            href={`/${person.role === 'freelancer' ? 'freelancer' : 'clients'}/profile/${encodeURIComponent(person.email)}`}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Profile
                          </Link>
                          
                                                     {/* Only show connect and message buttons if not the current user */}
                           {person.email !== localStorage.getItem('email') && (
                             <>
                               <ConnectionButton targetEmail={person.email} className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors" />
                               <MessageButton recipientEmail={person.email} className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors" />
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gigs Results */}
          {(activeTab === 'all' || activeTab === 'gigs') && results.results.gigs.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Gigs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.results.gigs.map((gig) => (
                  <div key={gig._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {gig.image && (
                      <div className="mb-4">
                        <img 
                          src={gig.image} 
                          alt={gig.title} 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{gig.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{gig.description}</p>
                    
                    {gig.skills && gig.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {gig.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {gig.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{gig.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-blue-600 font-bold text-lg">${gig.amount}</span>
                      <span className="text-sm text-gray-500">{gig.duration}</span>
                    </div>
                    
                    <Link
                      href={`/gigs/${gig._id}`}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
                    >
                      View Gig
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {totalResults === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-2-2m0 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                We couldn't find any results for "{query}". Try adjusting your search terms or browse our categories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}

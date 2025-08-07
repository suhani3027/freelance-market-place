"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Profile {
  _id?: string;
  userId?: string;
  email: string;
  profilePhoto?: string;
  fullName?: string;
  name?: string;
  location?: string;
  title?: string;
  overview?: string;
  businessDescription?: string;
  skills?: string[];
  categories?: string[];
  hourlyRate?: number;
  availability?: string;
  experienceLevel?: string;
  englishLevel?: string;
  education?: any[];
  employment?: any[];
  certifications?: any[];
  portfolio?: any[];
  languages?: any[];
  socialLinks?: any[];
  role?: string;
  companyName?: string;
  companySize?: string;
  website?: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [acceptRejectLoading, setAcceptRejectLoading] = useState(false);
  const [isRequester, setIsRequester] = useState(false);
  const [canConnect, setCanConnect] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const rawEmail = searchParams?.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('email') : null);
  const email = rawEmail ? decodeURIComponent(rawEmail) : null;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!email) {
        setError('No email provided');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/freelancer-profile/${encodeURIComponent(email)}`);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        console.error('Frontend: Profile fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email]);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!email || !profile) return;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const viewerEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
      
      // Only check connections if user is logged in and has a valid token
      if (viewerEmail && profile.email && viewerEmail !== profile.email && token && token !== 'client-token' && token !== 'freelancer-token' && token.startsWith('eyJ')) {
        try {
          const res = await fetch(`http://localhost:5000/api/connections/status/${encodeURIComponent(profile.email)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            setConnectionStatus(data.status);
            setConnectionId(data.connectionId);
            setIsRequester(data.isRequester);
            setCanConnect(data.canConnect);
          }
        } catch {}
      }
    };
    fetchConnectionStatus();
  }, [email, profile]);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || token === 'client-token' || token === 'freelancer-token' || !token.startsWith('eyJ')) return;
      
      try {
        const res = await fetch('http://localhost:5000/api/connections/pending', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPendingRequests(data);
        }
      } catch {}
    };
    fetchPendingRequests();
  }, []);

  const handleConnect = async () => {
    if (!profile?.email) return;
    setConnectLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'client-token' || token === 'freelancer-token' || !token.startsWith('eyJ')) {
        alert('Please log in to connect with users');
        setConnectLoading(false);
        return;
      }
      
      const res = await fetch('http://localhost:5000/api/connections/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: profile.email }),
      });
      
      if (res.ok) {
        setConnectionStatus('pending_sent');
        setCanConnect(false);
        alert('Connection request sent!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to send connection request');
      }
    } catch (err) {
      alert('Failed to send connection request');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setAcceptRejectLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/connections/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId }),
      });
      
      if (res.ok) {
        setConnectionStatus('connected');
        setCanConnect(false);
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        alert('Connection request accepted!');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to accept request');
      }
    } catch (err) {
      alert('Failed to accept request');
    } finally {
      setAcceptRejectLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setAcceptRejectLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/connections/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId }),
      });
      
      if (res.ok) {
        setConnectionStatus('rejected');
        setCanConnect(true);
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        alert('Connection request rejected');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to reject request');
      }
    } catch (err) {
      alert('Failed to reject request');
    } finally {
      setAcceptRejectLoading(false);
    }
  };

  const handleMessage = () => {
    if (profile?.email) {
      window.location.href = `/messages?user=${encodeURIComponent(profile.email)}`;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading profile...</div>;
  if (error) return (
    <div className="text-center mt-8">
      <div className="text-red-500 mb-4">{error}</div>
      <div className="text-gray-600 text-sm">
        {email ? `Trying to load profile for: ${email}` : 'No email provided'}
      </div>
      <button 
        onClick={() => window.history.back()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go Back
      </button>
    </div>
  );
  if (!profile) return (
    <div className="text-center mt-8">
      <div className="text-gray-600 mb-4">Profile not found</div>
      <div className="text-gray-600 text-sm">
        {email ? `No profile found for: ${email}` : 'No email provided'}
      </div>
      <button 
        onClick={() => window.history.back()} 
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go Back
      </button>
    </div>
  );

  const viewerEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 h-48 relative">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative p-6 border-b border-gray-200">
            <div className="flex items-start space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <img 
                  src={profile.profilePhoto || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" 
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.fullName || profile.name}</h1>
                    <p className="text-lg text-gray-600 mb-2">{profile.email}</p>
                    {profile.title && (
                      <p className="text-lg font-semibold text-gray-700 mb-1">{profile.title}</p>
                    )}
                    {profile.location && (
                      <p className="text-gray-600 mb-2">{profile.location}</p>
                    )}
                    {profile.hourlyRate && (
                      <p className="text-green-600 font-semibold text-lg mb-2">${profile.hourlyRate}/hr</p>
                    )}
                    {profile.experienceLevel && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {profile.experienceLevel}
                      </span>
                    )}
                  </div>
                  
                  {/* Connection Button */}
                  {viewerEmail && profile.email && viewerEmail !== profile.email && (
                    <div className="flex flex-col space-y-2">
                      {connectionStatus === 'connected' ? (
                        <div className="text-center">
                          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Connected
                          </span>
                          <button
                            onClick={handleMessage}
                            className="w-full mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Message
                          </button>
                        </div>
                      ) : connectionStatus === 'pending_sent' ? (
                        <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Request Sent
                        </span>
                      ) : connectionStatus === 'pending_received' ? (
                        <div className="text-center">
                          <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg mb-2">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                            Request Received
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => connectionId && handleAcceptRequest(connectionId)}
                              disabled={acceptRejectLoading}
                              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                            >
                              {acceptRejectLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => connectionId && handleRejectRequest(connectionId)}
                              disabled={acceptRejectLoading}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
                            >
                              {acceptRejectLoading ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ) : connectionStatus === 'rejected' ? (
                        <div className="text-center">
                          <span className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg mb-2">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Request Rejected
                          </span>
                          {canConnect && (
                            <button
                              onClick={handleConnect}
                              disabled={connectLoading}
                              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {connectLoading ? 'Sending...' : 'Connect'}
                            </button>
                          )}
                        </div>
                      ) : canConnect ? (
                        <button
                          onClick={handleConnect}
                          disabled={connectLoading}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          {connectLoading ? 'Sending...' : 'Connect'}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          {(profile.overview || profile.businessDescription) && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {profile.overview || profile.businessDescription || 'No overview available'}
              </p>
            </div>
          )}

          {/* Skills & Categories Section */}
          {(profile.skills?.length > 0 || profile.categories?.length > 0) && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Skills & Expertise</h2>
              {profile.skills?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.categories?.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.categories.map((category: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education Section */}
          {profile.education?.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Education</h2>
              <div className="space-y-3">
                {profile.education.map((edu: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                    <p className="text-gray-600">{edu.school}</p>
                    <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employment Section */}
          {profile.employment?.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Experience</h2>
              <div className="space-y-3">
                {profile.employment.map((emp: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900">{emp.role}</h3>
                    <p className="text-gray-600">{emp.company}</p>
                    <p className="text-sm text-gray-500">{emp.startYear} - {emp.endYear}</p>
                    {emp.description && (
                      <p className="text-gray-700 mt-1">{emp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Section */}
          {profile.portfolio?.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.portfolio.map((item: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    {item.url && (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Project →
                      </a>
                    )}
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-full h-32 object-cover rounded mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ClientProfile() {
  const { email: encodedEmail } = useParams();
  const email = encodedEmail && typeof encodedEmail === 'string' ? decodeURIComponent(encodedEmail) : null;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [gigs, setGigs] = useState<any[]>([]);
  const [gigsLoading, setGigsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:5000/api/user/${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Profile not found");
        const data = await res.json();
        setProfile(data);
        // Fetch connection status if not viewing own profile
        const viewerEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
        if (viewerEmail && data.email && viewerEmail !== data.email) {
          try {
            const token = localStorage.getItem('token');
            // Only proceed if we have a valid JWT token
            if (token && token !== 'client-token' && token !== 'freelancer-token' && token.startsWith('eyJ')) {
              const res = await fetch(`http://localhost:5000/api/connections/check/${encodeURIComponent(data.email)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const result = await res.json();
              if (result.connected) {
                setConnectionStatus('accepted');
              } else {
                // Check for pending/rejected requests
                const pendingRes = await fetch('http://localhost:5000/api/connections/pending', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const pendingList = await pendingRes.json();
                const pending = pendingList.find((c: any) => c.requester.email === viewerEmail && c.recipient.email === data.email);
                if (pending) {
                  setConnectionStatus(pending.status);
                } else {
                  setConnectionStatus(null);
                }
              }
            }
          } catch {}
        }
        // Fetch gigs for this user
        if (data.email) {
          setGigsLoading(true);
          try {
            const gigsRes = await fetch(`http://localhost:5000/api/gigs?clientId=${encodeURIComponent(data.email)}`);
            if (gigsRes.ok) {
              const gigsData = await gigsRes.json();
              setGigs(gigsData);
            } else {
              setGigs([]);
            }
          } catch {
            setGigs([]);
          } finally {
            setGigsLoading(false);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [email]);

  const handleConnect = async () => {
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
        body: JSON.stringify({ recipientId: profile.email })
      });
      if (res.ok) {
        setConnectionStatus('pending');
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to send request');
      }
    } catch {
      alert('Failed to send request');
    } finally {
      setConnectLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    </div>
  );
  
  if (!profile) return null;

  const viewerEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-48 relative">
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h1>
                    <p className="text-lg text-gray-600 mb-2">{profile.email}</p>
                    {profile.companyName && (
                      <p className="text-lg font-semibold text-gray-700 mb-1">{profile.companyName}</p>
                    )}
                    {profile.companySize && (
                      <p className="text-gray-600 mb-2">Company Size: {profile.companySize}</p>
                    )}
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {profile.website}
                      </a>
                    )}
                  </div>
                  
                  {/* Connection Button */}
                  {viewerEmail && profile.email && viewerEmail !== profile.email && (
                    <div className="flex flex-col space-y-2">
                      {connectionStatus === 'accepted' ? (
                        <div className="text-center">
                          <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Connected
                          </span>
                          <button className="w-full mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Message
                          </button>
                        </div>
                      ) : connectionStatus === 'pending' ? (
                        <span className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Request Pending
                        </span>
                      ) : connectionStatus === 'rejected' ? (
                        <div className="text-center">
                          <span className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg mb-2">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Request Rejected
                          </span>
                          <button
                            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={handleConnect}
                            disabled={connectLoading}
                          >
                            {connectLoading ? 'Sending...' : 'Connect'}
                          </button>
                        </div>
                      ) : (
                        <button
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                          onClick={handleConnect}
                          disabled={connectLoading}
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          {connectLoading ? 'Sending...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          {profile.businessDescription && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.businessDescription}</p>
            </div>
          )}

          {/* Gigs Section */}
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gigs Posted</h2>
            {gigsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">No gigs posted yet</p>
                <p className="text-sm">This user hasn't posted any gigs yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gigs.map((gig) => (
                  <div key={gig._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{gig.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {gig.description?.slice(0, 150)}{gig.description?.length > 150 ? '...' : ''}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          Posted on {gig.createdAt ? new Date(gig.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-blue-600 mb-2">₹{gig.amount || 0}</div>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
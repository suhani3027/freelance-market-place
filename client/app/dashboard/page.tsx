"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OrdersList from "../components/OrdersList";

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

interface ClientInfo {
  name: string;
  email: string;
}

// Dashboard Playcards Component matching exact screenshot design
function DashboardPlaycards({ role, gigs, clientId, freelancerId, onMyGigsClick }) {
  const [activeOrders, setActiveOrders] = useState(0);
  const [totalGigs, setTotalGigs] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    // Calculate total gigs posted by the user
    const userGigs = gigs.filter(gig => gig.clientId === (role === 'client' ? clientId : freelancerId));
    setTotalGigs(userGigs.length);

    // For now, hardcode earnings (as requested)
    setEarnings(0); // Starting with $0 as shown in screenshot

    // Calculate active orders (gigs with accepted proposals)
    setActiveOrders(0); // Starting with 0 as shown in screenshot

    // Set average rating
    setAverageRating(0); // Starting with 0 as shown in screenshot
  }, [gigs, role, clientId, freelancerId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full max-w-6xl">
      {/* Total Earnings Card */}
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">${earnings.toLocaleString()}</p>
            <p className="text-green-600 text-sm font-medium">+15% from last month</p>
          </div>
          <div className="text-green-500 ml-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Orders Card */}
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
                <div className="flex-1">
            <p className="text-gray-600 text-sm font-medium mb-1">Active Orders</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{activeOrders}</p>
            <p className="text-blue-600 text-sm font-medium">{activeOrders} completed</p>
                    </div>
          <div className="text-blue-500 ml-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
                  </div>
                  </div>
                </div>

      {/* Total Gigs Card - Clickable */}
      <div 
        className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
        onClick={onMyGigsClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-medium mb-1">Total Gigs</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalGigs}</p>
            <p className="text-purple-600 text-sm font-medium">0% completion rate</p>
                  </div>
          <div className="text-purple-500 ml-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Average Rating Card */}
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 text-sm font-medium mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{averageRating}</p>
            <p className="text-yellow-600 text-sm font-medium">2 hours response time</p>
                      </div>
          <div className="text-yellow-500 ml-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Actions Component matching screenshot
function QuickActions({ handleOrdersClick, role }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 mb-8 w-full max-w-6xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link href="/gigs/new">
          <button className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New service
          </button>
        </Link>
        <Link href="/my-gigs">
          <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Manage services
          </button>
        </Link>
        <button 
          onClick={handleOrdersClick}
          className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {role === 'client' ? 'My Purchases' : 'My Orders'}
        </button>
        {role === 'freelancer' && (
          <Link href="/dashboard/feedback">
            <button className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              My Feedback
            </button>
          </Link>
        )}
        <Link href="/messages">
          <button className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-yellow-600 transition flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Client chats
          </button>
        </Link>
      </div>
    </div>
  );
}

// Welcome Banner Component matching screenshot
function WelcomeBanner({ role, userName }) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-8 mb-8 w-full max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Welcome, {userName}!</h1>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg opacity-90">Manage your services and grow your freelance business</p>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
              0 Rating
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              0% Success Rate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              2 hours Response Time
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/my-gigs">
            <button className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-30 transition">
              My Gigs
            </button>
          </Link>
          <Link href="/gigs/new">
            <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
              + Create New Gig
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Component
function MainDashboard({ role, gigs, clientId, freelancerId, userName }) {
  const [showMyGigs, setShowMyGigs] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const router = useRouter();

  const handleMyGigsClick = () => {
    router.push('/my-gigs');
  };

  const handleBackToDashboard = () => {
    setShowMyGigs(false);
    setShowOrders(false);
    setFilteredGigs([]);
  };

  const handleOrdersClick = () => {
    setShowOrders(true);
  };

  if (showMyGigs) {
  return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Posted Gigs</h1>
            <button
              onClick={handleBackToDashboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
          
      {filteredGigs.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No gigs posted yet</h2>
              <p className="text-gray-600 mb-4">Start by creating your first gig!</p>
              <Link href="/gigs/new">
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">
                  Create Your First Gig
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredGigs.map((gig) => (
                <div key={gig._id} className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{gig.title}</h2>
                    <div className="flex gap-2">
                      <Link href={`/gigs/edit/${gig._id}`}>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                          Edit
                        </button>
                      </Link>
                      <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Amount:</span>
                      <span className="ml-2 text-green-600 font-semibold">${gig.amount}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Duration:</span>
                      <span className="ml-2">{gig.duration}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Posted:</span>
                      <span className="ml-2">{gig.createdAt ? new Date(gig.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  {gig.skills && gig.skills.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-600">Skills:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {gig.skills.map((skill, i) => (
                          <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-4 text-gray-700">{gig.description}</p>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>
    );
  }

  if (showOrders) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {role === 'client' ? 'My Purchases' : 'My Orders'}
            </h1>
            <button
              onClick={handleBackToDashboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
          
          <OrdersList userId={clientId} role={role} />
        </div>
      </div>
    );
  }

              return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <WelcomeBanner role={role} userName={userName} />
        
        {/* Dashboard Playcards */}
        <DashboardPlaycards 
          role={role} 
          gigs={gigs} 
          clientId={clientId} 
          freelancerId={freelancerId}
          onMyGigsClick={handleMyGigsClick}
        />
        
        {/* Quick Actions */}
        <QuickActions handleOrdersClick={handleOrdersClick} role={role} />
        
        {/* Additional content can be added here */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200 w-full max-w-6xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <p className="text-gray-600">No recent activity to display.</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  // Simulate clientId from localStorage (in real app, use auth)
  const clientId = typeof window !== 'undefined' ? localStorage.getItem('email') || 'demo-client' : 'demo-client';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      const storedEmail = localStorage.getItem('email');
      setRole(storedRole);
      setUserName(storedEmail ? storedEmail.split('@')[0] : 'User');
      setIsAuth(!!(token && storedRole));
    }
  }, []);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/gigs`);
        if (!res.ok) throw new Error("Failed to fetch gigs");
        const data = await res.json();
        setGigs(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Please log in to view your dashboard.</h1>
        <Link href="/login">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Log in</button>
        </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MainDashboard 
      role={role} 
      gigs={gigs} 
      clientId={clientId} 
      freelancerId={clientId} 
      userName={userName}
    />
  );
} 
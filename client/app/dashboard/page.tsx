'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '../../components/StarRating';

type UserRole = 'client' | 'freelancer';

type Order = {
  _id: string;
  amount: number;
  status: 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled';
  clientId: string;
  freelancerId: string;
};

type ReviewStats = {
  totalReviews: number;
  averageRating: number;
};

type ProposalStats = {
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
};

function StatCard({ title, value, subtitle, accent = 'blue' }: { title: string; value: string; subtitle?: string; accent?: 'blue' | 'green' | 'purple' | 'amber' }) {
  const ringClass = useMemo(() => ({
    blue: 'ring-blue-200',
    green: 'ring-green-200',
    purple: 'ring-purple-200',
    amber: 'ring-amber-200',
  }[accent]), [accent]);

  const badgeClass = useMemo(() => ({
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  }[accent]), [accent]);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm ring-1 ${ringClass}`}>
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle ? <div className={`inline-block mt-3 px-2 py-1 text-xs rounded-full ${badgeClass}`}>{subtitle}</div> : null}
    </div>
  );
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [proposalStats, setProposalStats] = useState<ProposalStats | null>(null);
  const [gigsCount, setGigsCount] = useState<number>(0);
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [earnings, setEarnings] = useState<number>(0);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    if (!userRole || !userEmail) return;
    setIsLoading(true);

    try {
      const authHeaders: HeadersInit = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const basePromises: Promise<any>[] = [
        fetch(`${apiUrl}/api/payments/orders/${encodeURIComponent(userEmail)}/${userRole}`, { headers: authHeaders }).then(r => r.ok ? r.json() : []),
        fetch(`${apiUrl}/api/proposals/stats/overview`, { headers: authHeaders }).then(r => r.ok ? r.json() : null),
        fetch(`${apiUrl}/api/connections/list`, { headers: authHeaders }).then(r => r.ok ? r.json() : []),
      ];

      if (userRole === 'freelancer') {
        basePromises.push(
          fetch(`${apiUrl}/api/reviews/freelancer/${encodeURIComponent(userEmail)}`).then(r => r.ok ? r.json() : null)
        );
      } else {
        basePromises.push(
          fetch(`${apiUrl}/api/gigs?clientId=${encodeURIComponent(userEmail)}`).then(r => r.ok ? r.json() : [])
        );
      }

      const [ordersData, proposalsData, connectionsData, fourthData] = await Promise.all(basePromises);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProposalStats(proposalsData);
      setConnectionsCount(Array.isArray(connectionsData) ? connectionsData.length : 0);

      if (userRole === 'freelancer') {
        if (fourthData && fourthData.stats) {
          setReviewStats({ totalReviews: fourthData.stats.totalReviews, averageRating: fourthData.stats.averageRating });
        } else {
          setReviewStats({ totalReviews: 0, averageRating: 0 });
        }
      } else {
        setGigsCount(Array.isArray(fourthData) ? fourthData.length : 0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem('role') as UserRole | null;
    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token');

    if (!token || !email) {
      router.push('/login');
      return;
    }

    setUserRole(role);
    setUserEmail(email);
    
    // Check if we need to refresh after payment
    const shouldRefresh = sessionStorage.getItem('refreshDashboard');
    if (shouldRefresh === 'true') {
      sessionStorage.removeItem('refreshDashboard');
      // Small delay to ensure backend has updated
      setTimeout(() => {
        fetchData();
      }, 1000);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [userRole, userEmail, apiUrl]);

  const totalCompletedAmount = useMemo(() => (
    orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.amount || 0), 0)
  ), [orders]);

  const totalEarnings = useMemo(() => (
    orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0)
  ), [orders]);

  const activeOrdersCount = useMemo(() => (
    orders.filter(o => o.status === 'paid' || o.status === 'in_progress').length
  ), [orders]);

  const uniqueCounterpartsCount = useMemo(() => connectionsCount, [connectionsCount]);

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm/6 opacity-90">Welcome, {userEmail}</div>
                <h1 className="text-2xl md:text-3xl font-bold mt-1">Manage your {userRole === 'freelancer' ? 'freelance business' : 'projects'}
                  <span className="ml-2">🚀</span>
                </h1>
                <div className="mt-2 flex items-center gap-4 text-sm/6 opacity-90">
                  <span>{userRole === 'freelancer' ? 'Grow your services and track performance' : 'Post gigs and track progress'}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {userRole === 'client' ? (
                  <>
                    <button onClick={() => router.push('/my-gigs')} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">My Gigs</button>
                    <button onClick={() => router.push('/gigs/new')} className="px-4 py-2 rounded-lg bg-white text-blue-700 font-medium">Create New Gig</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => router.push('/gigs')} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">Browse Gigs</button>
                    <button onClick={() => router.push('/freelancer/profile')} className="px-4 py-2 rounded-lg bg-white text-blue-700 font-medium">My Profile</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={userRole === 'freelancer' ? 'Total Earnings' : 'Total Spend'}
            value={userRole === 'freelancer' ? `$${totalEarnings.toLocaleString()}` : `$${totalCompletedAmount.toLocaleString()}`}
            subtitle={userRole === 'freelancer' ? 'From paid orders' : 'On completed orders'}
            accent={userRole === 'freelancer' ? 'green' : 'amber'}
          />

          <StatCard
            title="Active Orders"
            value={String(activeOrdersCount)}
            subtitle="In progress or awaiting start"
            accent="blue"
          />

          <StatCard
            title="Total Connections"
            value={String(uniqueCounterpartsCount)}
            subtitle="Accepted connections"
            accent="purple"
          />

          {userRole === 'freelancer' ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm ring-1 ring-amber-200">
              <div className="text-sm text-gray-500 mb-2">Average Rating</div>
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={reviewStats?.averageRating ?? 0} size="lg" readonly />
                <span className="text-2xl font-bold text-gray-900">
                  {(reviewStats?.averageRating ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="inline-block px-2 py-1 text-xs rounded-full bg-amber-50 text-amber-700">
                {reviewStats?.totalReviews ?? 0} reviews
              </div>
            </div>
          ) : (
            <StatCard
              title="My Gigs"
              value={String(gigsCount)}
              subtitle={`Proposals: ${proposalStats ? proposalStats.pending : 0} pending`}
              accent="green"
            />
          )}
        </div>

        {/* Proposals overview */}
        {proposalStats && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Proposals Overview</h3>
              <button
                onClick={() => router.push(userRole === 'client' ? '/freelancer/proposals' : '/freelancer/profile/proposals')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="rounded-lg bg-blue-50 text-blue-800 py-3">
                <div className="text-sm">Pending</div>
                <div className="text-xl font-semibold">{proposalStats.pending}</div>
              </div>
              <div className="rounded-lg bg-green-50 text-green-800 py-3">
                <div className="text-sm">Accepted</div>
                <div className="text-xl font-semibold">{proposalStats.accepted}</div>
              </div>
              <div className="rounded-lg bg-amber-50 text-amber-800 py-3">
                <div className="text-sm">Completed</div>
                <div className="text-xl font-semibold">{proposalStats.completed}</div>
              </div>
              <div className="rounded-lg bg-rose-50 text-rose-800 py-3">
                <div className="text-sm">Rejected</div>
                <div className="text-xl font-semibold">{proposalStats.rejected}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRole === 'client' ? (
            <>
              <button
                onClick={() => router.push('/gigs/new')}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow transition text-left"
              >
                <div className="font-semibold">Create Gig</div>
                <div className="text-sm text-gray-600">New service</div>
              </button>
              <button
                onClick={() => router.push('/my-gigs')}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow transition text-left"
              >
                <div className="font-semibold">My Gigs</div>
                <div className="text-sm text-gray-600">Manage services</div>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/gigs')}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow transition text-left"
              >
                <div className="font-semibold">Browse Gigs</div>
                <div className="text-sm text-gray-600">Find projects</div>
              </button>
              <button
                onClick={() => router.push('/freelancer/profile')}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow transition text-left"
              >
                <div className="font-semibold">My Profile</div>
                <div className="text-sm text-gray-600">Update information</div>
              </button>
            </>
          )}
        </div>

        {isLoading && (
          <div className="fixed inset-x-0 bottom-4 mx-auto w-max px-4 py-2 rounded-full bg-gray-900 text-white text-sm/6 shadow-lg">Refreshing dashboard…</div>
        )}
      </div>
    </div>
  );
}
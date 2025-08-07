"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';

interface Gig {
  _id: string;
  title: string;
  description: string;
  amount: number;
  technology: string;
  duration: string;
  clientId: string;
  createdAt?: string;
  skills?: string[];
  clientEmail?: string;
  image?: string;
}

interface ClientInfo {
  name: string;
  email: string;
}

const GigListPage = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientInfos, setClientInfos] = useState<{ [email: string]: ClientInfo }>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalSuccess, setProposalSuccess] = useState('');
  const [proposalError, setProposalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [freelancerId, setFreelancerId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [proposalCounts, setProposalCounts] = useState<{ [gigId: string]: number }>({});

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/gigs`);
        if (!res.ok) throw new Error("Failed to fetch gigs");
        const data = await res.json();
        setGigs(data);
        // Fetch client info for each gig
        const uniqueClientIds = Array.from(new Set(data.map((gig: Gig) => gig.clientId)));
        const infos: { [email: string]: ClientInfo } = {};
        await Promise.all(uniqueClientIds.map(async (email) => {
          try {
            const res = await fetch(`${apiUrl}/api/user/${encodeURIComponent(email)}`);
            if (res.ok) {
              const info = await res.json();
              infos[email] = info;
            }
          } catch {}
        }));
        setClientInfos(infos);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
      setFreelancerId(localStorage.getItem('email'));
      setClientId(localStorage.getItem('email')); // For clients, email serves as clientId
    }
  }, []);

  useEffect(() => {
    if (gigs.length > 0) {
      // After gigs are fetched:
      if (gigs && Array.isArray(gigs)) {
        // Fetch proposal counts for each gig
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        Promise.all(
          gigs.map(async (gig: Gig) => {
            try {
              const res = await fetch(`${apiUrl}/api/proposals/gig/${gig._id}`);
              if (res.ok) {
                const proposals = await res.json();
                return { gigId: gig._id, count: proposals.length };
              }
            } catch {}
            return { gigId: gig._id, count: 0 };
          })
        ).then(results => {
          const counts: { [gigId: string]: number } = {};
          results.forEach(r => { counts[r.gigId] = r.count; });
          setProposalCounts(counts);
        });
      }
    }
  }, [gigs.length]);

  // Show all gigs for freelancers, or only client's own gigs for clients
  let gigsToShow: Gig[] = gigs;
  if (role && role.toLowerCase() === 'client') {
    gigsToShow = clientId ? gigs.filter(gig => gig.clientId === clientId) : [];
  }
  // For freelancers, show all gigs (they can apply to any gig)
  const searchParams = useSearchParams();
  const search = searchParams?.get('search')?.toLowerCase() || '';
  const filteredGigs = search
    ? gigsToShow.filter(gig => {
        const searchLower = search.toLowerCase();
        const titleMatch = gig.title.toLowerCase().includes(searchLower);
        const skillsMatch = gig.skills && gig.skills.join(',').toLowerCase().includes(searchLower);
        const amountMatch = gig.amount && gig.amount.toString().includes(searchLower);
        const dateMatch = gig.createdAt && new Date(gig.createdAt).toLocaleString().toLowerCase().includes(searchLower);
        const descMatch = gig.description.toLowerCase().includes(searchLower);
        return titleMatch || skillsMatch || amountMatch || dateMatch || descMatch;
      })
    : gigsToShow;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading gigs...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (role && role.toLowerCase() === 'client' && !clientId) {
    return <div className="flex flex-col items-center justify-center h-64 text-lg">Please log in as a client to view your posted gigs.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        {role && role.toLowerCase() === 'client' ? 'My Posted Gigs' : 'Available Gigs'}
      </h1>
      {filteredGigs.length === 0 ? (
        <div className="text-gray-500 text-center">No gigs found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.map((gig) => {
            const client = clientInfos[gig.clientId];
            const clientInitial = client?.name?.charAt(0) || gig.clientId?.charAt(0) || 'U';
            
            return (
              <div key={gig._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                {/* Image Box - 16:9 aspect ratio */}
                <div className="relative w-full h-48 bg-gray-200">
                  {gig.image ? (
                    <img 
                      src={gig.image} 
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎯</div>
                        <div className="text-sm text-gray-500">No Image</div>
                      </div>
                    </div>
                  )}
                  {/* Heart icon for favorites */}
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Freelancer/Client Info */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-700">{clientInitial}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{client?.name || gig.clientId?.split('@')[0] || 'Unknown'}</div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          New
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {gig.title}
                  </h3>

                  {/* Category and Delivery Time */}
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {gig.skills && gig.skills.length > 0 ? gig.skills[0] : 'General'}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {gig.duration || 'Flexible'}
                    </span>
                  </div>

                  {/* Rating and Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-semibold">0.0</span>
                      <span className="text-gray-500 ml-1">(0)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Starting at</div>
                      <div className="font-bold text-lg">₹{gig.amount || 0}</div>
                    </div>
                  </div>

                  {/* Apply Button for Freelancers */}
                  {role && role.toLowerCase() === 'freelancer' && (
                    <button
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => {
                        setSelectedGig(gig);
                        setShowModal(true);
                        setCoverLetter('');
                        setProposalAmount(gig.amount ? gig.amount.toString() : '');
                        setProposalSuccess('');
                        setProposalError('');
                      }}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Proposal Modal */}
      {showModal && selectedGig && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Submit Proposal</h2>
            <div className="mb-4">
              <label className="block font-medium mb-1">Cover Letter</label>
              <textarea
                className="border rounded w-full p-2 min-h-[80px]"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Write a message to the client..."
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Proposed Amount</label>
              <input
                className="border rounded w-full p-2"
                type="number"
                value={proposalAmount}
                onChange={e => setProposalAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 w-full"
              disabled={submitting || !coverLetter || !proposalAmount}
              onClick={async () => {
                setSubmitting(true);
                setProposalSuccess('');
                setProposalError('');
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                  const res = await fetch(`${apiUrl}/api/proposals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      gigId: selectedGig._id,
                      freelancerId,
                      coverLetter,
                      amount: Number(proposalAmount),
                    }),
                  });
                  if (res.ok) {
                    setProposalSuccess('Proposal submitted successfully!');
                    setTimeout(() => setShowModal(false), 1200);
                  } else {
                    const data = await res.json();
                    setProposalError(data.message || 'Failed to submit proposal.');
                  }
                } catch {
                  setProposalError('Failed to submit proposal.');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Proposal'}
            </button>
            {proposalError && <div className="text-red-500 mt-2">{proposalError}</div>}
            {proposalSuccess && <div className="text-green-600 mt-2">{proposalSuccess}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default GigListPage; 
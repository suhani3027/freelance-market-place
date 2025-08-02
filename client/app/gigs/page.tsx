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
  clientEmail?: string; // Added for Upwork style client email
}

interface ClientInfo {
  name: string;
  email: string;
}

const GigListPage = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
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
  // Add a new state for proposal counts
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

  // Only show gigs posted by this client (for clients)
  let gigsToShow: Gig[] = gigs;
  if (role && role.toLowerCase() === 'client') {
    let clientId: string | null = null;
    if (typeof window !== 'undefined') {
      clientId = localStorage.getItem('email');
    }
    gigsToShow = clientId ? gigs.filter(gig => gig.clientId === clientId) : [];
  }
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

  if (!clientId) {
    return <div className="flex flex-col items-center justify-center h-64 text-lg">Please log in as a client to view your posted gigs.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Posted Gigs</h1>
      {filteredGigs.length === 0 ? (
        <div className="text-gray-500">No gigs found.</div>
      ) : (
        <ul className="space-y-4">
          {filteredGigs.map((gig) => {
            const isExpanded = expanded[gig._id];
            const client = clientInfos[gig.clientId];
            return (
              <li key={gig._id} className="border rounded-lg p-6 shadow hover:shadow-md transition bg-white">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span>Hourly • Expert</span>
                    <span>• Est. Time: {gig.duration || 'N/A'}</span>
                    <span>• Less than 30 hrs/week</span>
                  </div>
                  <h2 className="text-2xl font-semibold mb-1">{gig.title}</h2>
                  <p className="text-gray-700 mb-2">
                    {gig.description.length > 180 && !isExpanded ? (
                      <>
                        {gig.description.slice(0, 180)}... <span className="text-green-700 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [gig._id]: true }))}>more</span>
                      </>
                    ) : gig.description.length > 180 && isExpanded ? (
                      <>
                        {gig.description} <span className="text-green-700 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [gig._id]: false }))}>less</span>
                      </>
                    ) : gig.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {gig.skills && gig.skills.length > 0 && gig.skills.map((skill, i) => (
                      <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1"><span className="material-icons text-green-600">verified</span> Payment verified</span>
                    <span className="flex items-center gap-1 text-yellow-500">★★★★★</span>
                    <span>$1K+ spent</span>
                    <span>AUS</span>
                    <span>Proposals: {proposalCounts[gig._id] ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    {client && <span>Client: {client.name}</span>}
                    {/* Show client email Upwork style */}
                    {gig.clientEmail && (
                      <span>Client Email: {gig.clientEmail.replace(/(.).+(@.+)/, '$1***$2')}</span>
                    )}
                    {!gig.clientEmail && gig.clientId && (
                      <span>Client Email: {gig.clientId.replace(/(.).+(@.+)/, '$1***$2')}</span>
                    )}
                    {gig.createdAt && <span>Posted: {new Date(gig.createdAt).toLocaleString()}</span>}
                  </div>
                  {role && role.toLowerCase() === 'freelancer' && (
                    <button
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-max"
                      onClick={() => {
                        setSelectedGig(gig);
                        setShowModal(true);
                        setCoverLetter('');
                        setProposalAmount(gig.amount ? gig.amount.toString() : '');
                        setProposalSuccess('');
                        setProposalError('');
                      }}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
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
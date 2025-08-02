"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";

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
function ClientDashboard({ gigs, showPosted, setShowPosted, loading, error, filteredGigs, handleDelete, clientId, role }) {
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [clientInfos, setClientInfos] = useState<{ [email: string]: ClientInfo }>({});
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Add modal state for gig details
  const [showGigModal, setShowGigModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [proposalCounts, setProposalCounts] = useState<{ [gigId: string]: number }>({});

  useEffect(() => {
    const fetchClientInfos = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const uniqueClientIds = Array.from(new Set(filteredGigs.map((gig) => gig.clientId)));
      const infos: { [email: string]: ClientInfo } = {};
      await Promise.all(uniqueClientIds.map(async (email) => {
        if (!email) return;
        try {
          const res = await fetch(`${apiUrl}/api/user/${encodeURIComponent(email)}`);
          if (res.ok) {
            const info = await res.json();
            infos[email] = info;
          }
        } catch {}
      }));
      setClientInfos(infos);
    };
    fetchClientInfos();
  }, [filteredGigs]);

  useEffect(() => {
    // Fetch proposal counts for each gig
    if (filteredGigs && Array.isArray(filteredGigs)) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      Promise.all(
        filteredGigs.map(async (gig) => {
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
  }, [filteredGigs.length]);

  const fetchProposals = async (gigId: string) => {
    setProposalsLoading(true);
    setProposalsError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/proposals/gig/${gigId}`);
      if (!res.ok) throw new Error('Failed to fetch proposals');
      const data = await res.json();
      setProposals(data);
    } catch (err: any) {
      setProposalsError(err.message || 'Failed to fetch proposals');
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleProposalAction = async (proposalId: string, status: 'accepted' | 'rejected') => {
    setActionLoading(proposalId + status);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update proposal');
      // Update proposals in UI
      setProposals(prev => prev.map(p => p._id === proposalId ? { ...p, status } : p));
    } catch {
      // Optionally show error
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to your Client Dashboard</h1>
      <p className="text-lg mb-8">Ready to find top talent? Create a new gig to get started!</p>
      <div className="flex gap-4 mb-8">
        <Link href="/gigs/new">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition">
            Create Gig
          </button>
        </Link>
        <button
          className={`px-6 py-3 rounded-lg font-semibold text-lg border ${showPosted ? 'bg-green-600 text-white' : 'bg-white text-green-600 border-green-600'} transition`}
          onClick={() => setShowPosted((prev) => !prev)}
        >
          {showPosted ? 'Show All Gigs' : 'Posted Gigs'}
        </button>
      </div>
      {loading ? (
        <div>Loading gigs...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : filteredGigs.length === 0 ? (
        <div className="text-gray-500">No gigs found.</div>
      ) : (
        <ul className="w-full max-w-2xl space-y-4">
          {filteredGigs.map((gig) => {
            const isExpanded = expanded[gig._id];
            const client = gig.clientId ? clientInfos[gig.clientId] : null;
            return (
              <li
                key={gig._id}
                className="border rounded-lg p-4 shadow hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer"
                onClick={() => {
                  setSelectedGig(gig);
                  setShowGigModal(true);
                }}
              >
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{gig.title}</h2>
                  {gig.amount !== undefined && <div className="text-green-700 mb-1"><b>Amount:</b> ${gig.amount}</div>}
                  {gig.skills && Array.isArray(gig.skills) && gig.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {gig.skills.map((skill, i) => (
                        <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  )}
                  {gig.duration && <div className="text-gray-800 mb-1"><b>Duration:</b> {gig.duration}</div>}
                  {gig.description && (
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
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1"><span className="material-icons text-green-600">verified</span> Payment verified</span>
                    <span className="flex items-center gap-1 text-yellow-500">★★★★★</span>
                    <span>$1K+ spent</span>
                    <span>AUS</span>
                    <span>Proposals: {proposalCounts[gig._id] ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    {client && (
                      <span>
                        Client: <Link href={`/clients/profile/${encodeURIComponent(client.email)}`} className="text-blue-600 underline hover:text-blue-800">{client.name}</Link>
                      </span>
                    )}
                    {gig.createdAt && <span>Posted: {new Date(gig.createdAt).toLocaleString()}</span>}
                  </div>
                </div>
                {showPosted && gig.clientId === clientId && (
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      onClick={() => {
                        setSelectedGigId(gig._id);
                        setShowProposalsModal(true);
                        fetchProposals(gig._id);
                      }}
                    >
                      View Proposals
                    </button>
                    <Link href={`/gigs/edit/${gig._id}`}>
                      <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">Edit</button>
                    </Link>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      onClick={() => handleDelete(gig._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {/* Gig Detail Modal */}
      {showGigModal && selectedGig && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowGigModal(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-2">{selectedGig.title}</h2>
            <div className="mb-2 text-gray-600">Amount: <span className="text-green-700 font-semibold">${selectedGig.amount}</span></div>
            <div className="mb-2 text-gray-600">Duration: <span className="font-semibold">{selectedGig.duration}</span></div>
            <div className="mb-4 text-gray-700">{selectedGig.description}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedGig.skills && selectedGig.skills.length > 0 && selectedGig.skills.map((skill, i) => (
                <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1"><span className="material-icons text-green-600">verified</span> Payment verified</span>
              <span className="flex items-center gap-1 text-yellow-500">★★★★★</span>
              <span>$1K+ spent</span>
              <span>AUS</span>
              <span>Proposals: {proposalCounts[selectedGig._id] ?? 0}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              {selectedGig.clientId && clientInfos[selectedGig.clientId] && <span>Client: {clientInfos[selectedGig.clientId].name}</span>}
              {selectedGig.createdAt && <span>Posted: {new Date(selectedGig.createdAt).toLocaleString()}</span>}
            </div>
            {/* Apply button and proposal form for freelancers */}
            {role && role.toLowerCase() === 'freelancer' && (
              <ApplyProposalSection gig={selectedGig} onSuccess={() => setShowGigModal(false)} />
            )}
          </div>
        </div>
      )}
      {/* Proposals Modal */}
      {showProposalsModal && selectedGigId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowProposalsModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Proposals</h2>
            {proposalsLoading ? (
              <div>Loading proposals...</div>
            ) : proposalsError ? (
              <div className="text-red-500">{proposalsError}</div>
            ) : proposals.length === 0 ? (
              <div className="text-gray-500">No proposals yet.</div>
            ) : (
              <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
                {proposals.map((proposal) => (
                  <li key={proposal._id} className="border rounded p-4 bg-gray-50">
                    <div className="mb-2"><b>Freelancer:</b> {proposal.freelancerId}</div>
                    <div className="mb-2"><b>Cover Letter:</b> {proposal.coverLetter}</div>
                    <div className="mb-2"><b>Proposed Amount:</b> ${proposal.amount}</div>
                    <div className="mb-2"><b>Status:</b> <span className={proposal.status === 'accepted' ? 'text-green-600' : proposal.status === 'rejected' ? 'text-red-600' : 'text-gray-600'}>{proposal.status}</span></div>
                    {proposal.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                          disabled={actionLoading === proposal._id + 'accepted'}
                          onClick={() => handleProposalAction(proposal._id, 'accepted')}
                        >
                          {actionLoading === proposal._id + 'accepted' ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                          disabled={actionLoading === proposal._id + 'rejected'}
                          onClick={() => handleProposalAction(proposal._id, 'rejected')}
                        >
                          {actionLoading === proposal._id + 'rejected' ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for proposal form in modal
function ApplyProposalSection({ gig, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [proposalAmount, setProposalAmount] = useState(gig.amount ? gig.amount.toString() : '');
  const [proposalSuccess, setProposalSuccess] = useState('');
  const [proposalError, setProposalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [freelancerId, setFreelancerId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFreelancerId(localStorage.getItem('email') || '');
    }
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setProposalSuccess('');
    setProposalError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig._id,
          freelancerId,
          coverLetter,
          amount: Number(proposalAmount),
        }),
      });
      if (res.ok) {
        setProposalSuccess('Proposal submitted successfully!');
        setTimeout(() => onSuccess(), 1200);
      } else {
        const data = await res.json();
        setProposalError(data.message || 'Failed to submit proposal.');
      }
    } catch {
      setProposalError('Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Submit Proposal</h3>
      <div className="mb-2">
        <label className="block font-medium mb-1">Cover Letter</label>
        <textarea
          className="border rounded w-full p-2 min-h-[80px]"
          value={coverLetter}
          onChange={e => setCoverLetter(e.target.value)}
          placeholder="Write a message to the client..."
        />
      </div>
      <div className="mb-2">
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
        onClick={handleSubmit}
      >
        {submitting ? 'Submitting...' : 'Submit Proposal'}
      </button>
      {proposalError && <div className="text-red-500 mt-2">{proposalError}</div>}
      {proposalSuccess && <div className="text-green-600 mt-2">{proposalSuccess}</div>}
    </div>
  );
}

function FreelancerDashboard({ gigs, role }) {
  const [search, setSearch] = useState('');
  const [filteredGigs, setFilteredGigs] = useState(gigs);
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [clientInfos, setClientInfos] = useState<{ [email: string]: ClientInfo }>({});
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState('');
  const [freelancerId, setFreelancerId] = useState<string | null>(null);
  // Modal state for gig details
  const [showGigModal, setShowGigModal] = useState(false);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFreelancerId(localStorage.getItem('email'));
    }
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredGigs(
      gigs.filter(gig =>
        gig.title.toLowerCase().includes(lower) ||
        (gig.skills && gig.skills.join(',').toLowerCase().includes(lower)) ||
        (gig.amount && gig.amount.toString().includes(lower))
      )
    );
  }, [search, gigs]);

  useEffect(() => {
    const fetchClientInfos = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const uniqueClientIds = Array.from(new Set(filteredGigs.map((gig) => gig.clientId)));
      const infos: { [email: string]: ClientInfo } = {};
      await Promise.all(uniqueClientIds.map(async (email) => {
        if (!email) return;
        try {
          const res = await fetch(`${apiUrl}/api/user/${encodeURIComponent(email)}`);
          if (res.ok) {
            const info = await res.json();
            infos[email] = info;
          }
        } catch {}
      }));
      setClientInfos(infos);
    };
    fetchClientInfos();
  }, [filteredGigs]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!freelancerId) return;
      setProposalsLoading(true);
      setProposalsError('');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/proposals/freelancer/${encodeURIComponent(freelancerId)}`);
        if (!res.ok) throw new Error('Failed to fetch proposals');
        const data = await res.json();
        setProposals(data);
      } catch (err: any) {
        setProposalsError(err.message || 'Failed to fetch proposals');
      } finally {
        setProposalsLoading(false);
      }
    };
    fetchProposals();
  }, [freelancerId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <h1 className="text-4xl font-bold mb-6">Welcome to your Freelancer Dashboard</h1>
      <p className="text-lg mb-8">Browse and apply to available gigs!</p>
      {/* Search bar removed, now in navbar */}
      {filteredGigs.length === 0 ? (
        <div className="text-gray-500">No gigs found.</div>
      ) : (
        <ul className="w-full max-w-2xl space-y-4">
          {filteredGigs.map((gig) => {
            const isExpanded = expanded[gig._id];
            const client = gig.clientId ? clientInfos[gig.clientId] : null;
            return (
              <li
                key={gig._id}
                className="border rounded-lg p-4 shadow hover:shadow-md transition flex flex-col md:flex-row md:items-center md:justify-between cursor-pointer"
                onClick={() => {
                  setSelectedGig(gig);
                  setShowGigModal(true);
                }}
              >
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{gig.title}</h2>
                  {gig.amount !== undefined && <div className="text-green-700 mb-1"><b>Amount:</b> ${gig.amount}</div>}
                  {gig.skills && Array.isArray(gig.skills) && gig.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {gig.skills.map((skill, i) => (
                        <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  )}
                  {gig.duration && <div className="text-gray-800 mb-1"><b>Duration:</b> {gig.duration}</div>}
                  {gig.description && (
                    <p className="text-gray-700 mb-2">
                      {gig.description.length > 180 && !isExpanded ? (
                        <>
                          {gig.description.slice(0, 180)}... <span className="text-green-700 cursor-pointer" onClick={e => { e.stopPropagation(); setExpanded(ex => ({ ...ex, [gig._id]: true })); }}>more</span>
                        </>
                      ) : gig.description.length > 180 && isExpanded ? (
                        <>
                          {gig.description} <span className="text-green-700 cursor-pointer" onClick={e => { e.stopPropagation(); setExpanded(ex => ({ ...ex, [gig._id]: false })); }}>less</span>
                        </>
                      ) : gig.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1"><span className="material-icons text-green-600">verified</span> Payment verified</span>
                    <span className="flex items-center gap-1 text-yellow-500">★★★★★</span>
                    <span>$1K+ spent</span>
                    <span>AUS</span>
                    <span>Proposals: 5 to 10</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                    {client && <span>Client: {client.name}</span>}
                    {gig.createdAt && <span>Posted: {new Date(gig.createdAt).toLocaleString()}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {/* Gig Detail Modal */}
      {showGigModal && selectedGig && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowGigModal(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-2">{selectedGig.title}</h2>
            <div className="mb-2 text-gray-600">Amount: <span className="text-green-700 font-semibold">${selectedGig.amount}</span></div>
            <div className="mb-2 text-gray-600">Duration: <span className="font-semibold">{selectedGig.duration}</span></div>
            <div className="mb-4 text-gray-700">{selectedGig.description}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedGig.skills && selectedGig.skills.length > 0 && selectedGig.skills.map((skill, i) => (
                <span key={i} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1"><span className="material-icons text-green-600">verified</span> Payment verified</span>
              <span className="flex items-center gap-1 text-yellow-500">★★★★★</span>
              <span>$1K+ spent</span>
              <span>AUS</span>
              <span>Proposals: 5 to 10</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
              {selectedGig.clientId && clientInfos[selectedGig.clientId] && <span>Client: {clientInfos[selectedGig.clientId].name}</span>}
              {selectedGig.createdAt && <span>Posted: {new Date(selectedGig.createdAt).toLocaleString()}</span>}
            </div>
            {/* Apply button and proposal form for freelancers */}
            {role && role.toLowerCase() === 'freelancer' && (
              <ApplyProposalSection gig={selectedGig} onSuccess={() => setShowGigModal(false)} />
            )}
          </div>
        </div>
      )}
      {/* Proposals Section */}
      <div className="w-full max-w-2xl mt-12">
        <h2 className="text-2xl font-bold mb-4">My Proposals</h2>
        {proposalsLoading ? (
          <div>Loading proposals...</div>
        ) : proposalsError ? (
          <div className="text-red-500">{proposalsError}</div>
        ) : proposals.length === 0 ? (
          <div className="text-gray-500">No proposals submitted yet.</div>
        ) : (
          <ul className="space-y-4">
            {proposals.map((proposal) => {
              const gig = gigs.find(g => g._id === proposal.gigId);
              return (
                <li key={proposal._id} className="border rounded p-4 bg-gray-50">
                  <div className="mb-2"><b>Gig:</b> {gig ? gig.title : proposal.gigId}</div>
                  <div className="mb-2"><b>Cover Letter:</b> {proposal.coverLetter}</div>
                  <div className="mb-2"><b>Proposed Amount:</b> ${proposal.amount}</div>
                  <div className="mb-2"><b>Status:</b> <span className={proposal.status === 'accepted' ? 'text-green-600' : proposal.status === 'rejected' ? 'text-red-600' : 'text-gray-600'}>{proposal.status}</span></div>
                  <div className="mb-2"><b>Submitted:</b> {proposal.createdAt ? new Date(proposal.createdAt).toLocaleString() : ''}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [showPosted, setShowPosted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate clientId from localStorage (in real app, use auth)
  const clientId = typeof window !== 'undefined' ? localStorage.getItem('email') || 'demo-client' : 'demo-client';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      setRole(storedRole);
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

  const filteredGigs = showPosted
    ? gigs.filter((gig) => gig.clientId === clientId)
    : gigs;

  const handleDelete = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/gigs/${gigId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete gig');
      setGigs((prev) => prev.filter((gig) => gig._id !== gigId));
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard.</h1>
        <Link href="/login">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">Log in</button>
        </Link>
      </div>
    );
  }

  // Pass role as prop to ClientDashboard and FreelancerDashboard
  if (role === 'client') {
    return <ClientDashboard gigs={gigs} showPosted={showPosted} setShowPosted={setShowPosted} loading={loading} error={error} filteredGigs={filteredGigs} handleDelete={handleDelete} clientId={clientId} role={role} />;
  }
  if (role === 'freelancer') {
    return <FreelancerDashboard gigs={gigs} role={role} />;
  }
  return null;
} 
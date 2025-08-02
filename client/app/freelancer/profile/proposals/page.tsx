"use client";
import { useEffect, useState } from "react";

interface Proposal {
  _id: string;
  gigId: string;
  coverLetter: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Gig {
  _id: string;
  title: string;
}

export default function FreelancerProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [freelancerId, setFreelancerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFreelancerId(localStorage.getItem('email'));
    }
  }, []);

  useEffect(() => {
    const fetchProposalsAndGigs = async () => {
      if (!freelancerId) return;
      setLoading(true);
      setError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const [proposalsRes, gigsRes] = await Promise.all([
          fetch(`${apiUrl}/api/proposals/freelancer/${encodeURIComponent(freelancerId)}`),
          fetch(`${apiUrl}/api/gigs`)
        ]);
        if (!proposalsRes.ok) throw new Error("Failed to fetch proposals");
        if (!gigsRes.ok) throw new Error("Failed to fetch gigs");
        const proposalsData = await proposalsRes.json();
        const gigsData = await gigsRes.json();
        setProposals(proposalsData);
        setGigs(gigsData);
      } catch (err: any) {
        setError(err.message || "Failed to load proposals");
      } finally {
        setLoading(false);
      }
    };
    if (freelancerId) fetchProposalsAndGigs();
  }, [freelancerId]);

  function getGigTitle(gigId: string) {
    const gig = gigs.find(g => g._id === gigId);
    return gig ? gig.title : gigId;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">My Proposals</h1>
      {loading ? (
        <div>Loading proposals...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : proposals.length === 0 ? (
        <div className="text-gray-500">No proposals submitted yet.</div>
      ) : (
        <ul className="space-y-6">
          {proposals.map((proposal) => (
            <li key={proposal._id} className="border rounded p-6 bg-gray-50">
              <div className="mb-2"><b>Gig:</b> {getGigTitle(proposal.gigId)}</div>
              <div className="mb-2"><b>Cover Letter:</b> {proposal.coverLetter}</div>
              <div className="mb-2"><b>Proposed Amount:</b> ${proposal.amount}</div>
              <div className="mb-2"><b>Status:</b> <span className={proposal.status === 'accepted' ? 'text-green-600' : proposal.status === 'rejected' ? 'text-red-600' : 'text-gray-600'}>{proposal.status}</span></div>
              <div className="mb-2"><b>Submitted:</b> {proposal.createdAt ? new Date(proposal.createdAt).toLocaleString() : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
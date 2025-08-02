"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ClientProfile() {
  const { email } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

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
          } catch {}
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

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  if (!profile) return null;

  const viewerEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex flex-col items-center border rounded-lg shadow p-8 bg-white">
        <img src={profile.profilePhoto || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-gray-200" />
        <div className="text-2xl font-bold mb-1">{profile.name}</div>
        <div className="text-gray-600 mb-2">{profile.email}</div>
        {profile.companyName && (
          <div className="text-lg font-semibold mt-2">{profile.companyName}</div>
        )}
        {profile.companySize && (
          <div className="text-gray-700">Company Size: {profile.companySize}</div>
        )}
        {profile.website && (
          <div className="text-blue-600"><a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a></div>
        )}
        {profile.businessDescription && (
          <div className="mt-4 text-gray-800 text-center whitespace-pre-line">{profile.businessDescription}</div>
        )}
        {viewerEmail && profile.email && viewerEmail !== profile.email && (
          <div className="mt-4">
            {connectionStatus === 'accepted' ? (
              <span className="text-green-600 font-semibold">Connected</span>
            ) : connectionStatus === 'pending' ? (
              <span className="text-yellow-600 font-semibold">Request Pending</span>
            ) : connectionStatus === 'rejected' ? (
              <span className="text-red-600 font-semibold">Request Rejected</span>
            ) : (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleConnect}
                disabled={connectLoading}
              >
                {connectLoading ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
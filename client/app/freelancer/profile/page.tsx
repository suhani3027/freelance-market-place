"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';

export default function FreelancerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      let email = emailParam;
      if (!email) {
        email = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
      }
      if (!email) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/freelancer-profile/${encodeURIComponent(email)}`);
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
                setConnectionId(pending._id);
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
  }, [emailParam]);

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
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8 items-start border rounded-lg shadow p-8 bg-white">
        <div className="flex flex-col items-center w-full md:w-1/3">
          <img src={profile.profilePhoto || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="Profile" className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-gray-200" />
          <div className="text-2xl font-bold mb-1">{profile.fullName}</div>
          <div className="text-gray-600 mb-2">{profile.location}</div>
          <div className="text-green-700 font-semibold text-lg mb-2">${profile.hourlyRate}/hr</div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs mb-2">{profile.experienceLevel}</div>
          <div className="text-gray-500 text-sm mb-2">{profile.englishLevel} English</div>
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
        <div className="flex-1 w-full">
          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">{profile.title}</div>
            <div className="text-gray-700 mb-4 whitespace-pre-line">{profile.overview}</div>
            <div className="mb-2">
              <span className="font-semibold">Skills: </span>
              {profile.skills && profile.skills.length > 0 ? (
                <span>{profile.skills.join(", ")}</span>
              ) : (
                <span className="text-gray-400">No skills listed</span>
              )}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Categories: </span>
              {profile.categories && profile.categories.length > 0 ? (
                <span>{profile.categories.join(", ")}</span>
              ) : (
                <span className="text-gray-400">No categories listed</span>
              )}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Availability: </span>{profile.availability}
            </div>
          </div>
          <div className="mb-6">
            <div className="font-semibold text-lg mb-2">Education</div>
            {profile.education && profile.education.length > 0 ? (
              <ul className="list-disc ml-6">
                {profile.education.map((edu: any, i: number) => (
                  <li key={i} className="mb-1">
                    {edu.degree} in {edu.field} at {edu.school} ({edu.startYear} - {edu.endYear})
                  </li>
                ))}
              </ul>
            ) : <div className="text-gray-400">No education listed</div>}
          </div>
          <div className="mb-6">
            <div className="font-semibold text-lg mb-2">Employment</div>
            {profile.employment && profile.employment.length > 0 ? (
              <ul className="list-disc ml-6">
                {profile.employment.map((emp: any, i: number) => (
                  <li key={i} className="mb-1">
                    {emp.role} at {emp.company} ({emp.startYear} - {emp.endYear})
                  </li>
                ))}
              </ul>
            ) : <div className="text-gray-400">No employment listed</div>}
          </div>
          {profile.certifications && profile.certifications.length > 0 && (
            <div className="mb-6">
              <div className="font-semibold text-lg mb-2">Certifications</div>
              <ul className="list-disc ml-6">
                {profile.certifications.map((cert: any, i: number) => (
                  <li key={i} className="mb-1">{cert.name} ({cert.issuer}, {cert.year})</li>
                ))}
              </ul>
            </div>
          )}
          {profile.portfolio && profile.portfolio.length > 0 && (
            <div className="mb-6">
              <div className="font-semibold text-lg mb-2">Portfolio</div>
              <ul className="list-disc ml-6">
                {profile.portfolio.map((item: any, i: number) => (
                  <li key={i} className="mb-1">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-gray-700">{item.description}</div>
                    {item.url && <a href={item.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{item.url}</a>}
                    {item.image && <img src={item.image} alt={item.title} className="w-32 h-20 object-cover rounded mt-1" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
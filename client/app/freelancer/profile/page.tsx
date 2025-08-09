"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../lib/api';

export default function FreelancerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const email = localStorage.getItem('email');
      if (!email) {
        setError('Please log in to view profile');
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/freelancer-profile/${encodeURIComponent(email)}`);
      if (res.ok) {
        const profileData = await res.json();
        setProfile(profileData);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionRequest = async (freelancerEmail: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/status/${encodeURIComponent(freelancerEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.ok) {
        const status = await res.json();
        if (status.status === 'not_connected') {
          await sendConnectionRequest(freelancerEmail);
        }
      }
    } catch (error) {
      console.error('Failed to handle connection request:', error);
    }
  };

  const sendConnectionRequest = async (freelancerEmail: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/connections/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          freelancerEmail
        })
      });
      
      if (res.ok) {
        alert('Connection request sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send connection request:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">Error: {error}</div>
    </div>
  );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Profile not found.</div>
    </div>
  );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={profile.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                      alt="Profile" 
              className="w-20 h-20 rounded-full"
            />
                      <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-gray-600">{profile.title}</p>
              <p className="text-gray-500">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
              <h3 className="font-semibold mb-2">Experience</h3>
              <p className="text-gray-600">{profile.experience}</p>
            </div>
          </div>

          {profile.overview && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Overview</h3>
              <p className="text-gray-600">{profile.overview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
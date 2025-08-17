"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';
import { setAuthData } from '../../../lib/auth';

export default function FreelancerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Login failed.');
      } else {
        // Validate tokens before storing
        if (!data.accessToken || !data.refreshToken) {
          setError("Invalid response from server - missing tokens.");
          return;
        }

        // Use the new authentication system
        const success = setAuthData(data.accessToken, data.refreshToken, {
          email: data.email || form.email,
          role: data.role || 'freelancer',
          name: data.user?.name || data.name || form.email.split('@')[0]
        });

        if (!success) {
          setError("Failed to store authentication data. Please try again.");
          return;
        }
        
        // Check if freelancer profile exists
        try {
          const profileRes = await fetch(`${API_BASE_URL}/api/freelancer-profile/me`, {
            headers: {
              'Authorization': `Bearer ${data.accessToken}`
            }
          });
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.title && profileData.overview && profileData.skills && profileData.skills.length > 0) {
              // Profile is complete, go to dashboard
              router.push('/dashboard');
            } else {
              // Profile exists but incomplete, go to profile setup
              router.push('/freelancer/profile');
            }
          } else {
            // No profile found, go to welcome page
            router.push('/welcome');
          }
        } catch (profileErr) {
          console.error('Profile check error:', profileErr);
          router.push('/welcome');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Server error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Log in to your account</h1>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          disabled={isLoading}
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          disabled={isLoading}
        />
        {error && <div className="text-red-500">{error}</div>}
        <button 
          className={`py-2 rounded text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`} 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
} 
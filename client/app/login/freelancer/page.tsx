"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

export default function FreelancerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed.');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'freelancer');
        localStorage.setItem('email', form.email);
        localStorage.setItem('name', data.user.name);
        localStorage.setItem('profilePhoto', data.user.profilePhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
        
        // Check if freelancer profile exists
        try {
          const profileRes = await fetch(`${API_BASE_URL}/api/freelancer-profile/${encodeURIComponent(form.email)}`);
          if (profileRes.ok) {
            router.push('/freelancer/profile');
          } else {
            router.push('/welcome');
          }
        } catch (profileErr) {
          router.push('/welcome');
        }
      }
    } catch (err) {
      setError('Server error. Please try again later.');
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
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        {error && <div className="text-red-500">{error}</div>}
        <button className="bg-green-500 text-white py-2 rounded hover:bg-green-600" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
} 
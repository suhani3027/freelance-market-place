"use client";

import { useState } from 'react';

export default function ClientRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const validate = () => {
    if (!name || !email || !password || !companyName || !companySize || !businessDescription) return 'All fields are required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Invalid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'client', companyName, companySize, website, businessDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed.');
      } else {
        setSuccess('Registration successful! You can now log in.');
        setName('');
        setEmail('');
        setPassword('');
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', 'client-token');
          localStorage.setItem('role', 'client');
          localStorage.setItem('email', email);
          localStorage.setItem('name', name);
          localStorage.setItem('profilePhoto', 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
          window.location.href = '/welcome';
        }
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sign up to hire talent</h1>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={companySize}
          onChange={e => setCompanySize(e.target.value)}
        >
          <option value="">Company Size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-500">201-500 employees</option>
          <option value=">500">500+ employees</option>
        </select>
        <input
          className="border p-2 rounded"
          type="url"
          placeholder="Company Website (optional)"
          value={website}
          onChange={e => setWebsite(e.target.value)}
        />
        <textarea
          className="border p-2 rounded"
          placeholder="Describe your business, what you do, and what you’re looking for on Upwork..."
          value={businessDescription}
          onChange={e => setBusinessDescription(e.target.value)}
          rows={3}
        />
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Work Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Password (8 or more characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600" type="submit">
          Create Client Account
        </button>
      </form>
    </div>
  );
} 
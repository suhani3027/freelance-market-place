"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

export default function ClientRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const validate = () => {
    if (!name || !email || !password || !companyName || !industry) return 'Name, email, password, company name, and industry are required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Invalid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!companyName.trim()) return 'Company name cannot be empty.';
    if (businessDescription && businessDescription.trim().length < 20) return 'Business description should be at least 20 characters long.';
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
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role: 'client',
          companyName,
          companySize,
          industry,
          phone,
          website,
          linkedin,
          businessDescription
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed.');
      } else {
        // After registration, automatically log in to get a proper JWT token
        try {
          const loginRes = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('role', 'client');
            localStorage.setItem('email', email);
            localStorage.setItem('name', name);
            localStorage.setItem('profilePhoto', 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
            router.push('/welcome');
          } else {
            // If auto-login fails, redirect to login page
            router.push('/login');
          }
        } catch (loginErr) {
          router.push('/login');
        }
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join TaskNest as a Client
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with talented freelancers and bring your projects to life. 
            Create a professional profile to attract the best talent.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email *
                  </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="your@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                  placeholder="Create a strong password"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Must be at least 8 characters long
                </p>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                Company Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="Your company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    required
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={companySize}
                    onChange={e => setCompanySize(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-10 employees">1-10 employees</option>
                    <option value="11-50 employees">11-50 employees</option>
                    <option value="51-200 employees">51-200 employees</option>
                    <option value="201-1000 employees">201-1000 employees</option>
                    <option value="1000+ employees">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={businessDescription}
                  onChange={e => setBusinessDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                  rows={4}
                  placeholder="Describe your business, industry, and what type of projects you typically need help with..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about your needs to attract the right freelancers
                </p>
              </div>
            </div>

            {/* Professional Tip */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-400">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Professional Tip</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Complete profiles with detailed company information receive 3x more responses from qualified freelancers.
                  </p>
                </div>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Create Professional Account
        </button>
            </div>

            {/* Terms and Login Link */}
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-500">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800 underline">Terms of Service</a> and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>
              </p>
              
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="text-blue-600 hover:text-blue-800 font-semibold underline">
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
      </form>
        </div>
      </div>
    </div>
  );
} 
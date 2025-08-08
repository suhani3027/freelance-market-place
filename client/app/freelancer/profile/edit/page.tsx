'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EditProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const email = localStorage.getItem('email');
        if (!email) {
          router.push('/login');
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/freelancer-profile/${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          
          // Pre-fill the form with existing data
          setFullName(data.fullName || '');
          setLocation(data.location || '');
          setTitle(data.title || '');
          setOverview(data.overview || '');
          setSkills(data.skills || []);
          setHourlyRate(data.hourlyRate?.toString() || '');
          setAvailability(data.availability || '');
          setExperienceLevel(data.experienceLevel || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const email = localStorage.getItem('email');
      if (!email) {
        alert('Please log in again.');
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/freelancer-profile/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName,
          location,
          title,
          overview,
          skills,
          hourlyRate: Number(hourlyRate),
          availability,
          experienceLevel,
        }),
      });
      
      if (res.ok) {
        alert('Profile updated successfully!');
        router.push('/freelancer/profile');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      alert('Server error. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="City, Country"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Web Developer, Graphic Designer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overview</label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="Write a summary about your skills and experience..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (USD)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your hourly rate"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select availability</option>
                <option value="More than 30 hrs/week">More than 30 hrs/week</option>
                <option value="Less than 30 hrs/week">Less than 30 hrs/week</option>
                <option value="As needed - open to offers">As needed - open to offers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select experience level</option>
                <option value="Entry">Entry Level</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/freelancer/profile')}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

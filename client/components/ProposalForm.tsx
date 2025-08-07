"use client";
import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';

interface ProposalFormProps {
  gigId: string;
  gigTitle: string;
  gigBudget: number;
  onClose: () => void;
  onSubmit: (proposalData: any) => void;
}

interface FreelancerProfile {
  name: string;
  title: string;
  overview: string;
  skills: string[];
  hourlyRate: number;
  experienceLevel: string;
  location: string;
  profilePhoto?: string;
}

export default function ProposalForm({ 
  gigId, 
  gigTitle, 
  gigBudget, 
  onClose, 
  onSubmit 
}: ProposalFormProps) {
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetchFreelancerProfile();
  }, []);

  const fetchFreelancerProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/freelancer-profile/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      } else {
        console.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposal.trim() || !bidAmount || !estimatedDuration.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(bidAmount) <= 0) {
      alert('Bid amount must be greater than 0');
      return;
    }

    if (proposal.length < 50) {
      alert('Proposal must be at least 50 characters long');
      return;
    }

    setLoading(true);
    try {
      const proposalData = {
        gigId,
        proposal: proposal.trim(),
        bidAmount: parseFloat(bidAmount),
        estimatedDuration: estimatedDuration.trim()
      };

      onSubmit(proposalData);
    } catch (error) {
      console.error('Error submitting proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Required</h2>
          <p className="text-gray-600 mb-4">
            You need to complete your freelancer profile before submitting proposals.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.href = '/freelancer/profile'}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Submit Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Gig Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Gig Details</h3>
          <p className="text-gray-700 mb-2"><strong>Title:</strong> {gigTitle}</p>
          <p className="text-gray-700"><strong>Budget:</strong> ${gigBudget}</p>
        </div>

        {/* Freelancer Profile Preview */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Your Profile</h3>
          <div className="flex items-start gap-4">
            {profile.profilePhoto && (
              <img 
                src={profile.profilePhoto} 
                alt={profile.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{profile.name}</h4>
              <p className="text-gray-600 text-sm">{profile.title}</p>
              <p className="text-gray-600 text-sm">${profile.hourlyRate}/hr • {profile.experienceLevel}</p>
              <p className="text-gray-600 text-sm">{profile.location}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-gray-700 text-sm line-clamp-3">{profile.overview}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bid Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Bid Amount ($) *
            </label>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder="Enter your bid amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              step="0.01"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Client's budget: ${gigBudget}
            </p>
          </div>

          {/* Estimated Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration *
            </label>
            <input
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="e.g., 2-3 weeks, 1 month, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Proposal */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Proposal *
            </label>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Describe your approach, experience, and why you're the best fit for this project..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={8}
              minLength={50}
              maxLength={2000}
              required
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {proposal.length}/2000 characters (minimum 50)
              </span>
              <span className="text-xs text-gray-500">
                Minimum 50 characters
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !proposal.trim() || !bidAmount || !estimatedDuration.trim() || proposal.length < 50}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Proposal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
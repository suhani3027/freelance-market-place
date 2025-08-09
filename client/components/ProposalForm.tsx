"use client";
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

interface ProposalFormProps {
  gigId: string;
  gigTitle: string;
  gigBudget: number;
  onClose: () => void;
  onSubmit: (proposalData: any) => void;
}

interface FreelancerProfile {
  _id: string;
  name: string;
  title: string;
  skills: string[];
  experience: string;
  portfolio: string[];
}

const ProposalForm: React.FC<ProposalFormProps> = ({
  gigId,
  gigTitle,
  gigBudget,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    proposal: '',
    bidAmount: '',
    estimatedDuration: '',
    milestones: ['']
  });
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFreelancerProfile();
  }, []);

  const fetchFreelancerProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to submit a proposal');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/freelancer-profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setFreelancerProfile(profile);
      } else {
        setError('Failed to load freelancer profile');
      }
    } catch (error) {
      setError('Failed to load freelancer profile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const proposalData = {
        gigId,
        proposal: formData.proposal,
        bidAmount: parseFloat(formData.bidAmount),
        estimatedDuration: formData.estimatedDuration,
        milestones: formData.milestones.filter(milestone => milestone.trim() !== '')
      };

      await onSubmit(proposalData);
      onClose();
    } catch (error) {
      setError('Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, '']
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => i === index ? value : milestone)
    }));
  };

  if (!freelancerProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Submit Proposal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Gig Details</h3>
          <p className="text-blue-800">{gigTitle}</p>
          <p className="text-blue-700">Budget: ${gigBudget}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Proposal
            </label>
            <textarea
              required
              value={formData.proposal}
              onChange={(e) => setFormData(prev => ({ ...prev, proposal: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              placeholder="Describe your approach, experience, and why you're the best fit for this project..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bid (USD)
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.bidAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, bidAmount: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your bid amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <select
                required
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select duration</option>
                <option value="1-3 days">1-3 days</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2-3 months">2-3 months</option>
                <option value="3+ months">3+ months</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milestones (Optional)
            </label>
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={milestone}
                  onChange={(e) => updateMilestone(index, e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Milestone ${index + 1}`}
                />
                {formData.milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestone}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Add Milestone
            </button>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalForm; 
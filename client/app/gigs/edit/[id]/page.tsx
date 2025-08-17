'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '../../../../lib/api';
import { getToken, getUser, isValidTokenFormat, clearAuthData } from '../../../../lib/auth';

export default function EditGigPage() {
  const params = useParams();
  const router = useRouter();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: {
      min: '',
      max: ''
    },
    duration: '',
    skills: [],
    attachments: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const token = getToken();
      const userData = getUser();
      
      if (!token || !userData || !isValidTokenFormat(token)) {
        console.log('No valid token or user data found, redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      }
      
      // Check if user is a client
      if (userData.role !== 'client') {
        alert('Only clients can edit gigs');
        router.push('/dashboard');
        return;
      }
      
      setUser(userData);
      fetchGigDetails();
    } catch (error) {
      console.error('Error checking authentication:', error);
      clearAuthData();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchGigDetails = async () => {
    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        console.log('No valid token available for fetching gig details');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const gigData = await response.json();
        setGig(gigData);
        
        // Check if user owns this gig
        if (gigData.clientEmail !== user?.email) {
          alert('You can only edit your own gigs');
          router.push('/my-gigs');
          return;
        }
        
        // Populate form with existing data
        setFormData({
          title: gigData.title || '',
          description: gigData.description || '',
          category: gigData.category || '',
          budget: {
            min: gigData.budget?.min || '',
            max: gigData.budget?.max || ''
          },
          duration: gigData.duration || '',
          skills: gigData.skills || [],
          attachments: gigData.attachments || []
        });
      } else if (response.status === 401) {
        console.log('Token validation failed, clearing auth data and redirecting to login');
        clearAuthData();
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch gig details:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch gig details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = getToken();
      
      if (!token || !isValidTokenFormat(token)) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/gigs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Gig updated successfully!');
        setTimeout(() => {
          router.push('/my-gigs');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update gig');
      }
    } catch (error) {
      console.error('Error updating gig:', error);
      setError('Failed to update gig. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Edit Gig</h1>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <textarea
          className="border p-2 rounded"
          placeholder="Description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          required
        />
        <input
          className="border p-2 rounded"
          type="number"
          placeholder="Amount (e.g. 500)"
          value={formData.budget.max}
          onChange={e => setFormData({ ...formData, budget: { ...formData.budget, max: e.target.value } })}
          min={0}
          required
        />
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700" type="submit">
          Update Gig
        </button>
      </form>
    </div>
  );
} 
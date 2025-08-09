"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '../../../lib/api';

export default function CategoryPage() {
  const { category } = useParams();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGigsByCategory();
  }, [category]);

  const fetchGigsByCategory = async () => {
    try {
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/gigs/category/${category}`);
      
      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      } else {
        setError('Failed to fetch gigs');
      }
    } catch (error) {
      setError('Failed to fetch gigs');
    } finally {
      setLoading(false);
    }
  };

  const searchGigsInCategory = async (searchTerm: string) => {
    try {
      const apiUrl = API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/gigs/search?category=${category}&q=${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const data = await response.json();
        setGigs(data);
      } else {
        setError('Failed to search gigs');
      }
    } catch (error) {
      setError('Failed to search gigs');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading {category} gigs...</div>
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

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 capitalize">{category} Gigs</h1>
        
        {gigs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No gigs found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <div key={gig._id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-2">{gig.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{gig.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">${gig.amount}</span>
                  <span className="text-gray-500">{gig.duration}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
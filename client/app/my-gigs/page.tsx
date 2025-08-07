"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Gig {
  _id: string;
  title: string;
  technology?: string;
  duration?: string;
  amount?: number;
  description: string;
  clientId?: string;
  createdAt?: string;
  skills?: string[];
  status?: string;
  orders?: number;
  views?: number;
  earned?: number;
  rating?: number;
  reviewCount?: number;
}

export default function MyGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gigToDelete, setGigToDelete] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");
    
    if (!email || !token) {
      router.push("/login");
      return;
    }
    
    setUserEmail(email);
    fetchMyGigs(email);
  }, [router]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const fetchMyGigs = async (email: string) => {
    try {
      console.log("Fetching gigs for user:", email);
      const response = await fetch(`http://localhost:5000/api/gigs?clientId=${encodeURIComponent(email)}`);
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched gigs:", data);
        console.log("Number of gigs found:", data.length);
        
        // Add mock data for demonstration to match the screenshot
        const gigsWithMockData = data.map((gig: Gig, index: number) => ({
          ...gig,
          orders: index === 0 ? 0 : index === 1 ? 0 : 23,
          views: index === 0 ? 12 : index === 1 ? 45 : 1234,
          earned: index === 0 ? 0 : index === 1 ? 0 : 6877,
          rating: index === 0 ? 0 : index === 1 ? 0 : 4.9,
          reviewCount: index === 0 ? 0 : index === 1 ? 0 : 18,
          status: index === 0 ? "active" : index === 1 ? "active" : "active"
        }));
        console.log("Gigs with mock data:", gigsWithMockData);
        setGigs(gigsWithMockData);
      } else {
        console.error("Failed to fetch gigs, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setGigs([]);
      }
    } catch (error) {
      console.error("Error fetching gigs:", error);
      setGigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGig = (gigId: string) => {
    router.push(`/gigs/${gigId}`);
  };

  const handleEditGig = (gigId: string) => {
    router.push(`/gigs/edit/${gigId}`);
  };

  const handleDeleteGig = async (gigId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/gigs/${gigId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the gig from the local state
        setGigs(gigs.filter(gig => gig._id !== gigId));
        setShowDeleteModal(false);
        setGigToDelete(null);
      } else {
        console.error("Failed to delete gig");
        alert("Failed to delete gig. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting gig:", error);
      alert("Error deleting gig. Please try again.");
    }
  };

  const handleToggleStatus = async (gigId: string, currentStatus: string) => {
    // This would update the gig status in the backend
    console.log("Toggle status for gig:", gigId, "from", currentStatus);
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "paused":
        return <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">Paused</span>;
      case "in-queue":
        return <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">In queue</span>;
      default:
        return null;
    }
  };

  const getMockImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop"
    ];
    return images[index % images.length];
  };

  const toggleMenu = (gigId: string) => {
    setShowMenu(showMenu === gigId ? null : gigId);
  };

  const openDeleteModal = (gigId: string) => {
    setGigToDelete(gigId);
    setShowDeleteModal(true);
    setShowMenu(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading your gigs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">My Posted Gigs</h1>
            <Link href="/gigs/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Create New Gig
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gigs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">You haven't posted any gigs yet</div>
            <Link href="/gigs/new">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                Create Your First Gig
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.length > 0 ? gigs.map((gig, index) => (
              <div key={gig._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Gig Image */}
                <div className="relative">
                  <img
                    src={getMockImage(index)}
                    alt={gig.title}
                    className="w-full h-48 object-cover"
                  />
                  {getStatusTag(gig.status || "active")}
                  
                  {/* Like Button and Three-dot Menu */}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {/* Like Button */}
                    <button className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition">
                       <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                       </svg>
                     </button>
                     
                    {/* Three-dot Menu */}
                    <div className="relative menu-container">
                      <button 
                        onClick={() => toggleMenu(gig._id)}
                        className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showMenu === gig._id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => openDeleteModal(gig._id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gig Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {gig.title}
                  </h3>
                  
                  {/* Reviews */}
                  <div className="flex items-center mb-2">
                    {gig.rating && gig.rating > 0 ? (
                      <>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(gig.rating!) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-1">({gig.reviewCount})</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">No reviews yet</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-lg font-bold text-gray-900 mb-3">
                    ${gig.amount || 0}
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 mb-4">
                    <div>
                      <div className="font-semibold">{gig.orders || 0}</div>
                      <div>Orders</div>
                    </div>
                    <div>
                      <div className="font-semibold">{gig.views || 0}</div>
                      <div>Views</div>
                    </div>
                    <div>
                      <div className="font-semibold">${gig.earned || 0}</div>
                      <div>Earned</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewGig(gig._id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      onClick={() => handleEditGig(gig._id)}
                      className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(gig._id, gig.status || "active")}
                      className="flex items-center justify-center w-10 h-10 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    >
                      {gig.status === "paused" ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 text-lg mb-4">You haven't posted any gigs yet</div>
                <Link href="/gigs/new">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                    Create Your First Gig
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Gig</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this gig? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setGigToDelete(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => gigToDelete && handleDeleteGig(gigToDelete)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
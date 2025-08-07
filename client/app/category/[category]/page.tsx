"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from 'next/navigation';

interface Gig {
  _id: string;
  title: string;
  description: string;
  amount: number;
  technology: string;
  duration: string;
  clientId: string;
  createdAt?: string;
  skills?: string[];
  clientEmail?: string;
  image?: string;
}

interface ClientInfo {
  name: string;
  email: string;
}

// Define category to skills mapping
const categorySkills: { [key: string]: string[] } = {
  graphics: ['Graphic Design', 'Logo Design', 'Illustration', 'Photoshop', 'Illustrator', 'UI/UX', 'Web Design', 'Branding', 'Typography', 'Print Design'],
  marketing: ['Digital Marketing', 'SEO', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'PPC', 'Google Ads', 'Facebook Ads', 'Analytics', 'Marketing Strategy'],
  writing: ['Content Writing', 'Copywriting', 'Translation', 'Blog Writing', 'Article Writing', 'Technical Writing', 'Creative Writing', 'Editing', 'Proofreading', 'Ghostwriting'],
  video: ['Video Editing', 'Animation', 'Motion Graphics', 'Video Production', 'After Effects', 'Premiere Pro', '3D Animation', 'Video Marketing', 'YouTube', 'Videography'],
  music: ['Music Production', 'Audio Editing', 'Sound Design', 'Voice Over', 'Podcast Editing', 'Mixing', 'Mastering', 'Composition', 'Audio Engineering', 'Jingle Creation'],
  programming: ['Web Development', 'JavaScript', 'React', 'Node.js', 'Python', 'PHP', 'WordPress', 'Mobile App', 'API Development', 'Database', 'Full Stack', 'Frontend', 'Backend'],
  business: ['Business Plan', 'Market Research', 'Financial Analysis', 'Business Strategy', 'Project Management', 'Consulting', 'Business Development', 'Sales', 'Customer Service'],
  lifestyle: ['Fitness Training', 'Nutrition', 'Wellness', 'Life Coaching', 'Personal Development', 'Health', 'Lifestyle', 'Fashion', 'Beauty', 'Travel'],
  data: ['Data Analysis', 'Data Science', 'Machine Learning', 'Excel', 'SQL', 'Python', 'R', 'Statistics', 'Data Visualization', 'Big Data', 'Analytics']
};

const CategoryPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const category = params.category as string;
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientInfos, setClientInfos] = useState<{ [email: string]: ClientInfo }>({});
  const [role, setRole] = useState<string | null>(null);
  const [freelancerId, setFreelancerId] = useState<string | null>(null);
  const [proposalCounts, setProposalCounts] = useState<{ [gigId: string]: number }>({});

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    const displayNames: { [key: string]: string } = {
      graphics: 'Graphics & Design',
      marketing: 'Digital Marketing',
      writing: 'Writing & Translation',
      video: 'Video & Animation',
      music: 'Music & Audio',
      programming: 'Programming & Tech',
      business: 'Business',
      lifestyle: 'Lifestyle',
      data: 'Data'
    };
    return displayNames[category] || category;
  };

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/gigs`);
        if (!res.ok) throw new Error("Failed to fetch gigs");
        const data = await res.json();
        
        // Filter gigs by category skills
        const categorySkillsList = categorySkills[category] || [];
        const filteredGigs = data.filter((gig: Gig) => {
          if (!gig.skills || gig.skills.length === 0) return false;
          
          // Check if any of the gig's skills match the category skills
          return gig.skills.some(skill => 
            categorySkillsList.some(categorySkill => 
              skill.toLowerCase().includes(categorySkill.toLowerCase()) ||
              categorySkill.toLowerCase().includes(skill.toLowerCase())
            )
          );
        });
        
        // Sort by creation date (most recent first)
        const sortedGigs = filteredGigs.sort((a: Gig, b: Gig) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setGigs(sortedGigs);
        
        // Fetch client info for each gig
        const uniqueClientIds = Array.from(new Set(filteredGigs.map((gig: Gig) => gig.clientId)));
        const infos: { [email: string]: ClientInfo } = {};
        await Promise.all(uniqueClientIds.map(async (email) => {
          try {
            const res = await fetch(`${apiUrl}/api/user/${encodeURIComponent(email)}`);
            if (res.ok) {
              const info = await res.json();
              infos[email] = info;
            }
          } catch {}
        }));
        setClientInfos(infos);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [category]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('role'));
      setFreelancerId(localStorage.getItem('email'));
    }
  }, []);

  useEffect(() => {
    if (gigs.length > 0) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      Promise.all(
        gigs.map(async (gig: Gig) => {
          try {
            const res = await fetch(`${apiUrl}/api/proposals/gig/${gig._id}`);
            if (res.ok) {
              const proposals = await res.json();
              return { gigId: gig._id, count: proposals.length };
            }
          } catch {}
          return { gigId: gig._id, count: 0 };
        })
      ).then(results => {
        const counts: { [gigId: string]: number } = {};
        results.forEach(r => { counts[r.gigId] = r.count; });
        setProposalCounts(counts);
      });
    }
  }, [gigs.length]);

  const search = searchParams?.get('search')?.toLowerCase() || '';
  const filteredGigs = search
    ? gigs.filter(gig => {
        const searchLower = search.toLowerCase();
        const titleMatch = gig.title.toLowerCase().includes(searchLower);
        const skillsMatch = gig.skills && gig.skills.join(',').toLowerCase().includes(searchLower);
        const amountMatch = gig.amount && gig.amount.toString().includes(searchLower);
        const dateMatch = gig.createdAt && new Date(gig.createdAt).toLocaleString().toLowerCase().includes(searchLower);
        const descMatch = gig.description.toLowerCase().includes(searchLower);
        return titleMatch || skillsMatch || amountMatch || dateMatch || descMatch;
      })
    : gigs;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading gigs...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{getCategoryDisplayName(category)} Gigs</h1>
      <p className="text-gray-600 mb-8">Find opportunities in {getCategoryDisplayName(category).toLowerCase()}</p>
      
      {filteredGigs.length === 0 ? (
        <div className="text-gray-500 text-center">No gigs found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.map((gig) => {
            const client = clientInfos[gig.clientId];
            const clientInitial = client?.name?.charAt(0) || gig.clientId?.charAt(0) || 'U';
            
            return (
              <div key={gig._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                {/* Image Box - 16:9 aspect ratio */}
                <div className="relative w-full h-48 bg-gray-200">
                  {gig.image ? (
                    <img 
                      src={gig.image} 
                      alt={gig.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎯</div>
                        <div className="text-sm text-gray-500">No Image</div>
                      </div>
                    </div>
                  )}
                  {/* Heart icon for favorites */}
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Freelancer/Client Info */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-700">{clientInitial}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{client?.name || gig.clientId?.split('@')[0] || 'Unknown'}</div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          New
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
                    {gig.title}
                  </h3>

                  {/* Category and Delivery Time */}
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {gig.skills && gig.skills.length > 0 ? gig.skills[0] : 'General'}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {gig.duration || 'Flexible'}
                    </span>
                  </div>

                  {/* Rating and Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <span className="text-yellow-400 mr-1">★</span>
                      <span className="font-semibold">0.0</span>
                      <span className="text-gray-500 ml-1">(0)</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Starting at</div>
                      <div className="font-bold text-lg">₹{gig.amount || 0}</div>
                    </div>
                  </div>

                  {/* Apply Button for Freelancers */}
                  {role && role.toLowerCase() === 'freelancer' && (
                    <button
                      className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => {
                        window.location.href = `/gigs?search=${encodeURIComponent(gig.title)}`;
                      }}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryPage; 
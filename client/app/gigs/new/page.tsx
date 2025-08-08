'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const exampleTitles = [
  'Build responsive WordPress site with booking/payment functionality',
  'Graphic designer needed to design ad creative for multiple campaigns',
  'Facebook ad specialist needed for product launch',
];

const popularSkills = [
  'Graphic Design', 'English', 'Adobe Photoshop', 'Web Design', 'Content Writing', 'Writing',
  'Web Development', 'Data Entry', 'HTML', 'JavaScript', 'WordPress', 'Russian',
  'Adobe Illustrator', 'PHP', 'Arabic', 'Microsoft Excel', 'HTML5', 'Creative Writing',
];

export default function NewGig() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check user role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRole = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      if (userRole !== 'client') {
        setError('Only clients can create gigs. Please log in as a client.');
        setLoading(false);
        return;
      }
      
      setRole(userRole);
      setLoading(false);
    }
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Show loading or error state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Access Denied</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">1/6 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Let's start with a strong title.</h2>
              <p className="mb-6 text-gray-700">This helps your job post stand out to the right candidates. It's the first thing they'll see, so make it count!</p>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <label className="block mb-2 font-medium">Write a title for your job post</label>
              <input
                className="border p-2 rounded w-full mb-4"
                type="text"
                placeholder="e.g. Build a landing page for my business"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <div className="mb-2 font-medium">Example titles</div>
              <ul className="list-disc ml-6 text-gray-700">
                {exampleTitles.map((ex, i) => <li key={i}>{ex}</li>)}
              </ul>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">2/6 Job post</div>
              <h2 className="text-3xl font-bold mb-2">What are the main skills required for your work?</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <label className="block mb-2 font-medium">Search skills or add your own</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-gray-100 mb-2">
                <span className="mr-2 text-gray-500">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-2-2"/></svg>
                </span>
                <input
                  type="text"
                  className="bg-transparent outline-none flex-1 text-gray-700"
                  placeholder="Add a skill"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && skillInput.trim()) {
                      e.preventDefault();
                      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
                      setSkillInput('');
                    }
                  }}
                />
              </div>
              <div className="mb-2 text-gray-500 text-sm">For the best results, add 3-5 skills</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    {skill}
                    <button
                      onClick={() => setSkills(skills.filter((_, index) => index !== i))}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mb-2 text-gray-500 text-sm">Popular skills</div>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!skills.includes(skill)) setSkills([...skills, skill]);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">3/6 Job post</div>
              <h2 className="text-3xl font-bold mb-2">What's your budget for this project?</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <label className="block mb-2 font-medium">Budget (USD)</label>
              <input
                className="border p-2 rounded w-full mb-4"
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <div className="text-gray-600 text-sm">
                <p>• This is the amount you're willing to pay for this project</p>
                <p>• Freelancers will see this budget and can propose within this range</p>
                <p>• You can negotiate the final price with the selected freelancer</p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">4/6 Job post</div>
              <h2 className="text-3xl font-bold mb-2">How long will this project take?</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <label className="block mb-2 font-medium">Project duration</label>
              <select
                className="border p-2 rounded w-full mb-4"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              >
                <option value="">Select duration</option>
                <option value="Less than 1 week">Less than 1 week</option>
                <option value="1 to 2 weeks">1 to 2 weeks</option>
                <option value="2 to 4 weeks">2 to 4 weeks</option>
                <option value="1 to 3 months">1 to 3 months</option>
                <option value="3 to 6 months">3 to 6 months</option>
                <option value="More than 6 months">More than 6 months</option>
              </select>
              <div className="text-gray-600 text-sm">
                <p>• This helps freelancers understand the project scope</p>
                <p>• You can adjust the timeline during the project</p>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">5/6 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Describe your project in detail</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <label className="block mb-2 font-medium">Project description</label>
              <textarea
                className="border p-2 rounded w-full mb-4 min-h-[200px]"
                placeholder="Describe what you need, your goals, and any specific requirements..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div className="text-gray-600 text-sm">
                <p>• Be specific about what you need</p>
                <p>• Include any technical requirements</p>
                <p>• Mention your goals and expectations</p>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">6/6 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Add an image to make your gig stand out</h2>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <label className="block mb-2 font-medium">Upload an image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="border p-2 rounded w-full mb-4"
              />
              {imagePreview && (
                <div className="mb-4">
                  <img src={imagePreview} alt="Preview" className="w-full max-w-md rounded" />
                </div>
              )}
              <div className="text-gray-600 text-sm">
                <p>• Images help your gig get more attention</p>
                <p>• Supported formats: JPG, PNG, GIF</p>
                <p>• Maximum size: 5MB</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const handleFinalSubmit = async () => {
    setError('');
    setSuccess('');
    if (!title || !skills.length || !duration || !amount || !description) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const userId = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
      const userEmail = userId;
      const token = localStorage.getItem('token');

      // Check if token exists
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        router.push('/login');
        return;
      }

      

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('skills', JSON.stringify(skills));
      formData.append('duration', duration);
      formData.append('amount', amount);
      formData.append('description', description);
      formData.append('clientId', userId || '');
      formData.append('clientEmail', userEmail || '');
      if (image) {
        formData.append('image', image);
      }


              // FormData contents logged for debugging

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      
      const res = await fetch(`${apiUrl}/api/gigs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        
        
        if (res.status === 401) {
          setError('Authentication failed. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          localStorage.removeItem('role');
          router.push('/login');
          return;
        }
        
        setError(errorData.error || errorData.message || `Failed to create gig. Status: ${res.status}`);
        return;
      }
      
      const data = await res.json();
      

      setSuccess('Gig created successfully!');
      setTimeout(() => {
        router.push('/my-gigs');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating gig:', error);
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to create gig. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8">
        {renderStep()}
        
        <div className="flex justify-between items-center mt-8 px-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Gig
            </button>
          )}
        </div>
        
        {error && (
          <div className="mt-4 px-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}
        
        {success && (
          <div className="mt-4 px-8">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
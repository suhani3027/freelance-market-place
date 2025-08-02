'use client';

import { useState } from 'react';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">1/5 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Let's start with a strong title.</h2>
              <p className="mb-6 text-gray-700">This helps your job post stand out to the right candidates. It’s the first thing they’ll see, so make it count!</p>
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
              <div className="text-gray-500 mb-2">2/5 Job post</div>
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
                  <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                    {skill}
                    <button className="ml-2 text-red-500" onClick={() => setSkills(skills.filter((s, idx) => idx !== i))}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="mb-2 font-medium">Popular skills</div>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill, i) => (
                  <button
                    key={i}
                    type="button"
                    className="border px-3 py-1 rounded-full hover:bg-green-100"
                    onClick={() => { if (!skills.includes(skill)) setSkills([...skills, skill]); }}
                  >
                    {skill} +
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
              <div className="text-gray-500 mb-2">3/5 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Project duration</h2>
              <p className="mb-6 text-gray-700">How long will this project take?</p>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8 gap-4">
              <input
                className="border p-2 rounded"
                type="text"
                placeholder="Duration (e.g. 2 weeks)"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">4/5 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Project budget</h2>
              <p className="mb-6 text-gray-700">What is your budget for this project?</p>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8 gap-4">
              <input
                className="border p-2 rounded"
                type="number"
                placeholder="Amount (e.g. 500)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto min-h-[60vh]">
            <div className="flex-1 flex flex-col justify-center p-8">
              <div className="text-gray-500 mb-2">5/5 Job post</div>
              <h2 className="text-3xl font-bold mb-2">Describe your project</h2>
              <p className="mb-6 text-gray-700">Give freelancers more details about what you need. The more information you provide, the better your matches will be.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center p-8">
              <textarea
                className="border p-2 rounded w-full min-h-[120px]"
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
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
      setError('Please fill in all fields.');
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const clientId = typeof window !== 'undefined' ? localStorage.getItem('email') : null;
      const clientEmail = clientId; // For clarity, use clientEmail
      const res = await fetch(`${apiUrl}/api/gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, skills, duration, amount, description, clientId, clientEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Gig created successfully!');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setError(data.message || 'Failed to create gig.');
      }
    } catch (err) {
      setError('Failed to create gig.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">Create a New Gig</div>
            <div className="text-gray-500">Step {step} of 5</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(step / 5) * 100}%` }}></div>
          </div>
        </div>
        {renderStep()}
        <div className="flex justify-between mt-8">
          <button
            className="px-6 py-2 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            Back
          </button>
          {step < 5 ? (
            <button
              className="px-6 py-2 rounded bg-green-600 text-white font-semibold"
              onClick={() => setStep((prev) => prev + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="px-6 py-2 rounded bg-blue-600 text-white font-semibold"
              onClick={handleFinalSubmit}
            >
              Submit
            </button>
          )}
        </div>
        {error && <div className="text-red-500 mt-4">{error}</div>}
        {success && <div className="text-green-600 mt-4">{success}</div>}
      </div>
    </div>
  );
} 
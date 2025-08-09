'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../lib/api';

const steps = [
  'Profile Basics',
  'Title & Overview',
  'Skills & Categories',
  'Work Preferences',
  'Education & Employment',
  'Portfolio',
  'Review & Submit',
];

export default function FreelancerQuestions() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  // Step 1: Profile basics
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');

  // Step 2: Title & Overview
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');

  // Step 3: Skills & Categories
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const popularSkills = [
    'Web Development', 'Graphic Design', 'Content Writing', 'JavaScript', 'React', 'Node.js', 'UI/UX', 'Python', 'Data Entry', 'SEO', 'WordPress', 'HTML', 'CSS', 'Project Management', 'Translation', 'Copywriting', 'Mobile App', 'Marketing', 'Video Editing', 'Customer Service', 'Accounting',
  ];
  const popularCategories = [
    'Development & IT', 'Design & Creative', 'Writing & Translation', 'Sales & Marketing', 'Admin & Customer Support', 'Finance & Accounting', 'Engineering & Architecture', 'Legal',
  ];

  // Step 4: Work Preferences
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // Step 5: Education & Employment
  const [education, setEducation] = useState<any[]>([]);
  const [employment, setEmployment] = useState<any[]>([]);
  // Temp states for adding new entries
  const [eduInput, setEduInput] = useState({ school: '', degree: '', field: '', startYear: '', endYear: '' });
  const [empInput, setEmpInput] = useState({ company: '', role: '', startYear: '', endYear: '', description: '' });

  // Step 6: Certifications & Portfolio
  const [certifications, setCertifications] = useState<any[]>([]);
  const [certInput, setCertInput] = useState({ name: '', issuer: '', year: '' });
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [portfolioInput, setPortfolioInput] = useState({ title: '', description: '', url: '', image: '' });

  // Step 7: Review & Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      if (!token || role !== 'freelancer') {
        window.location.href = '/login';
      }
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Profile Basics</h2>
            <div className="flex flex-col items-center gap-2">
              <label className="font-medium">Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
              {profilePhotoPreview && <img src={profilePhotoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover mt-2" />}
            </div>
            <input className="border p-2 rounded w-full" type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
            <input className="border p-2 rounded w-full" type="text" placeholder="Location (Country, City)" value={location} onChange={e => setLocation(e.target.value)} />
            <select className="border p-2 rounded w-full" value={englishLevel} onChange={e => setEnglishLevel(e.target.value)}>
              <option value="">English Proficiency</option>
              <option value="Basic">Basic</option>
              <option value="Conversational">Conversational</option>
              <option value="Fluent">Fluent</option>
              <option value="Native/Bilingual">Native/Bilingual</option>
            </select>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Title & Overview</h2>
            <input
              className="border p-2 rounded w-full"
              type="text"
              placeholder="Your professional headline (e.g. Web Developer, Graphic Designer)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={70}
            />
            <textarea
              className="border p-2 rounded w-full min-h-[120px]"
              placeholder="Write a summary to highlight your skills, experience, and what you offer."
              value={overview}
              onChange={e => setOverview(e.target.value)}
              maxLength={500}
            />
            <div className="text-gray-500 text-sm w-full text-right">{overview.length}/500</div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Skills & Categories</h2>
            <div className="w-full">
              <label className="font-medium">Skills (add at least 3)</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-gray-100 mb-2">
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
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, i) => (
                  <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                    {skill}
                    <button className="ml-2 text-red-500" onClick={() => setSkills(skills.filter((s, idx) => idx !== i))}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="mb-2 font-medium">Popular skills</div>
              <div className="flex flex-wrap gap-2 mb-4">
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
            <div className="w-full">
              <label className="font-medium">Categories (choose at least 1)</label>
              <div className="flex items-center border rounded-lg px-2 py-1 bg-gray-100 mb-2">
                <input
                  type="text"
                  className="bg-transparent outline-none flex-1 text-gray-700"
                  placeholder="Add a category"
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && categoryInput.trim()) {
                      e.preventDefault();
                      if (!categories.includes(categoryInput.trim())) setCategories([...categories, categoryInput.trim()]);
                      setCategoryInput('');
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map((cat, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                    {cat}
                    <button className="ml-2 text-red-500" onClick={() => setCategories(categories.filter((c, idx) => idx !== i))}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="mb-2 font-medium">Popular categories</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {popularCategories.map((cat, i) => (
                  <button
                    key={i}
                    type="button"
                    className="border px-3 py-1 rounded-full hover:bg-blue-100"
                    onClick={() => { if (!categories.includes(cat)) setCategories([...categories, cat]); }}
                  >
                    {cat} +
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Work Preferences</h2>
            <input
              className="border p-2 rounded w-full"
              type="number"
              min="1"
              placeholder="Hourly Rate (USD)"
              value={hourlyRate}
              onChange={e => setHourlyRate(e.target.value)}
            />
            <select
              className="border p-2 rounded w-full"
              value={availability}
              onChange={e => setAvailability(e.target.value)}
            >
              <option value="">Availability</option>
              <option value="More than 30 hrs/week">More than 30 hrs/week</option>
              <option value="Less than 30 hrs/week">Less than 30 hrs/week</option>
              <option value="As needed - open to offers">As needed - open to offers</option>
            </select>
            <select
              className="border p-2 rounded w-full"
              value={experienceLevel}
              onChange={e => setExperienceLevel(e.target.value)}
            >
              <option value="">Experience Level</option>
              <option value="Entry">Entry Level</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Education & Employment</h2>
            <div className="w-full">
              <label className="font-medium">Education</label>
              <div className="flex flex-col gap-2 mb-2">
                <input className="border p-2 rounded" type="text" placeholder="School" value={eduInput.school} onChange={e => setEduInput({ ...eduInput, school: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Degree" value={eduInput.degree} onChange={e => setEduInput({ ...eduInput, degree: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Field of Study" value={eduInput.field} onChange={e => setEduInput({ ...eduInput, field: e.target.value })} />
                <div className="flex gap-2">
                  <input className="border p-2 rounded w-1/2" type="text" placeholder="Start Year" value={eduInput.startYear} onChange={e => setEduInput({ ...eduInput, startYear: e.target.value })} />
                  <input className="border p-2 rounded w-1/2" type="text" placeholder="End Year" value={eduInput.endYear} onChange={e => setEduInput({ ...eduInput, endYear: e.target.value })} />
                </div>
                <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => {
                  if (eduInput.school && eduInput.degree) {
                    setEducation([...education, eduInput]);
                    setEduInput({ school: '', degree: '', field: '', startYear: '', endYear: '' });
                  }
                }}>Add Education</button>
              </div>
              <ul className="mb-2">
                {education.map((edu, i) => (
                  <li key={i} className="text-sm flex items-center gap-2 mb-1">
                    <span>{edu.degree} in {edu.field} at {edu.school} ({edu.startYear} - {edu.endYear})</span>
                    <button className="text-red-500" onClick={() => setEducation(education.filter((_, idx) => idx !== i))}>&times;</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full">
              <label className="font-medium">Employment</label>
              <div className="flex flex-col gap-2 mb-2">
                <input className="border p-2 rounded" type="text" placeholder="Company" value={empInput.company} onChange={e => setEmpInput({ ...empInput, company: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Role" value={empInput.role} onChange={e => setEmpInput({ ...empInput, role: e.target.value })} />
                <div className="flex gap-2">
                  <input className="border p-2 rounded w-1/2" type="text" placeholder="Start Year" value={empInput.startYear} onChange={e => setEmpInput({ ...empInput, startYear: e.target.value })} />
                  <input className="border p-2 rounded w-1/2" type="text" placeholder="End Year" value={empInput.endYear} onChange={e => setEmpInput({ ...empInput, endYear: e.target.value })} />
                </div>
                <textarea className="border p-2 rounded" placeholder="Description" value={empInput.description} onChange={e => setEmpInput({ ...empInput, description: e.target.value })} />
                <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => {
                  if (empInput.company && empInput.role) {
                    setEmployment([...employment, empInput]);
                    setEmpInput({ company: '', role: '', startYear: '', endYear: '', description: '' });
                  }
                }}>Add Employment</button>
              </div>
              <ul>
                {employment.map((emp, i) => (
                  <li key={i} className="text-sm flex items-center gap-2 mb-1">
                    <span>{emp.role} at {emp.company} ({emp.startYear} - {emp.endYear})</span>
                    <button className="text-red-500" onClick={() => setEmployment(employment.filter((_, idx) => idx !== i))}>&times;</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Certifications & Portfolio <span className='text-sm text-gray-500'>(optional)</span></h2>
            <div className="w-full">
              <label className="font-medium">Certifications</label>
              <div className="flex flex-col gap-2 mb-2">
                <input className="border p-2 rounded" type="text" placeholder="Certification Name" value={certInput.name} onChange={e => setCertInput({ ...certInput, name: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Issuer" value={certInput.issuer} onChange={e => setCertInput({ ...certInput, issuer: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Year" value={certInput.year} onChange={e => setCertInput({ ...certInput, year: e.target.value })} />
                <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => {
                  if (certInput.name && certInput.issuer) {
                    setCertifications([...certifications, certInput]);
                    setCertInput({ name: '', issuer: '', year: '' });
                  }
                }}>Add Certification</button>
              </div>
              <ul className="mb-2">
                {certifications.map((cert, i) => (
                  <li key={i} className="text-sm flex items-center gap-2 mb-1">
                    <span>{cert.name} ({cert.issuer}, {cert.year})</span>
                    <button className="text-red-500" onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))}>&times;</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full">
              <label className="font-medium">Portfolio</label>
              <div className="flex flex-col gap-2 mb-2">
                <input className="border p-2 rounded" type="text" placeholder="Project Title" value={portfolioInput.title} onChange={e => setPortfolioInput({ ...portfolioInput, title: e.target.value })} />
                <textarea className="border p-2 rounded" placeholder="Description" value={portfolioInput.description} onChange={e => setPortfolioInput({ ...portfolioInput, description: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Project URL" value={portfolioInput.url} onChange={e => setPortfolioInput({ ...portfolioInput, url: e.target.value })} />
                <input className="border p-2 rounded" type="text" placeholder="Image URL (optional)" value={portfolioInput.image} onChange={e => setPortfolioInput({ ...portfolioInput, image: e.target.value })} />
                <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => {
                  if (portfolioInput.title && portfolioInput.description) {
                    setPortfolio([...portfolio, portfolioInput]);
                    setPortfolioInput({ title: '', description: '', url: '', image: '' });
                  }
                }}>Add Portfolio Item</button>
              </div>
              <ul>
                {portfolio.map((item, i) => (
                  <li key={i} className="text-sm flex items-center gap-2 mb-1">
                    <span>{item.title} ({item.url})</span>
                    <button className="text-red-500" onClick={() => setPortfolio(portfolio.filter((_, idx) => idx !== i))}>&times;</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold">Review & Submit</h2>
            <div className="w-full bg-gray-50 rounded p-4 mb-4">
              <div className="mb-2"><b>Full Name:</b> {fullName}</div>
              <div className="mb-2"><b>Location:</b> {location}</div>
              <div className="mb-2"><b>English Level:</b> {englishLevel}</div>
              <div className="mb-2"><b>Title:</b> {title}</div>
              <div className="mb-2"><b>Overview:</b> {overview}</div>
              <div className="mb-2"><b>Skills:</b> {skills.join(', ')}</div>
              <div className="mb-2"><b>Categories:</b> {categories.join(', ')}</div>
              <div className="mb-2"><b>Hourly Rate:</b> ${hourlyRate}/hr</div>
              <div className="mb-2"><b>Availability:</b> {availability}</div>
              <div className="mb-2"><b>Experience Level:</b> {experienceLevel}</div>
              <div className="mb-2"><b>Education:</b>
                <ul className="ml-4 list-disc">
                  {education.map((edu, i) => <li key={i}>{edu.degree} in {edu.field} at {edu.school} ({edu.startYear} - {edu.endYear})</li>)}
                </ul>
              </div>
              <div className="mb-2"><b>Employment:</b>
                <ul className="ml-4 list-disc">
                  {employment.map((emp, i) => <li key={i}>{emp.role} at {emp.company} ({emp.startYear} - {emp.endYear})</li>)}
                </ul>
              </div>
              {certifications.length > 0 && <div className="mb-2"><b>Certifications:</b>
                <ul className="ml-4 list-disc">
                  {certifications.map((cert, i) => <li key={i}>{cert.name} ({cert.issuer}, {cert.year})</li>)}
                </ul>
              </div>}
              {portfolio.length > 0 && <div className="mb-2"><b>Portfolio:</b>
                <ul className="ml-4 list-disc">
                  {portfolio.map((item, i) => <li key={i}>{item.title} ({item.url})</li>)}
                </ul>
              </div>}
            </div>
            {submitError && <div className="text-red-500 mb-2">{submitError}</div>}
            {submitSuccess && <div className="text-green-600 mb-2">{submitSuccess}</div>}
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              onClick={async () => {
                setSubmitting(true);
                setSubmitError('');
                setSubmitSuccess('');
                try {
                  let userId = '';
                  if (typeof window !== 'undefined') {
                    userId = localStorage.getItem('email');
                    if (!userId) {
                      const userStr = localStorage.getItem('user');
                      if (userStr) {
                        try {
                          const userObj = JSON.parse(userStr);
                          userId = userObj?.email || '';
                        } catch (e) {
                          userId = '';
                        }
                      }
                    }
                  }
                  if (!userId) {
                    setSubmitError('User email not found. Please log in again.');
                    setSubmitting(false);
                    return;
                  }
                  const res = await fetch(`${API_BASE_URL}/api/freelancer-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId,
                      email: userId, // This is correct since userId is the email
                      profilePhoto: profilePhotoPreview,
                      fullName,
                      location,
                      englishLevel,
                      title,
                      overview,
                      skills,
                      categories,
                      hourlyRate: Number(hourlyRate),
                      availability,
                      experienceLevel,
                      education,
                      employment,
                      certifications,
                      portfolio,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setSubmitError(data.message || 'Failed to save profile.');
                  } else {
                    setSubmitSuccess('Profile saved successfully! Redirecting...');
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('profileComplete', 'true');
                      if (profilePhotoPreview) localStorage.setItem('profilePhoto', profilePhotoPreview);
                      if (fullName) localStorage.setItem('name', fullName);
                    }
                    setTimeout(() => router.push('/dashboard'), 1500);
                  }
                } catch (err) {
                  setSubmitError('Server error. Please try again later.');
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Profile'}
            </button>
          </div>
        );
      // More steps will be added here
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex-1 h-2 rounded ${i < step ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          ))}
        </div>
        <div className="mb-6 text-center">
          <div className="text-lg font-semibold text-gray-700">Step {step} of {steps.length}: {steps[step-1]}</div>
        </div>
        {renderStep()}
        <div className="flex justify-between mt-8">
          <button
            className="border px-6 py-2 rounded-lg text-green-700 border-green-700 bg-white hover:bg-green-50 disabled:opacity-50"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </button>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && (!fullName || !location || !englishLevel)) ||
              (step === 2 && (!title || !overview)) ||
              (step === 3 && (skills.length < 3 || categories.length < 1)) ||
              (step === 4 && (!hourlyRate || !availability || !experienceLevel)) ||
              (step === 5 && (!education.length || !employment.length)) ||
              step === steps.length
            }
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 
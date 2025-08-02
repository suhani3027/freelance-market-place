"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FreelancerLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (form.email && form.password) {
      localStorage.setItem("token", "freelancer-token");
      localStorage.setItem("role", "freelancer");
      localStorage.setItem("email", form.email);
      localStorage.setItem("name", form.email.split("@")[0]);
      localStorage.setItem("profilePhoto", "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png");
      // Check onboarding status from backend
      try {
        const res = await fetch(`http://localhost:5000/api/freelancer-profile/${encodeURIComponent(form.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.fullName) {
            localStorage.setItem('profileComplete', 'true');
            if (data.profilePhoto) localStorage.setItem('profilePhoto', data.profilePhoto);
            if (data.fullName) localStorage.setItem('name', data.fullName);
            router.push('/dashboard');
            return;
          }
        }
        // If no profile or incomplete, go to onboarding
        localStorage.removeItem('profileComplete');
        router.push('/freelancer/questions');
      } catch (err) {
        // On error, go to onboarding
        localStorage.removeItem('profileComplete');
        router.push('/freelancer/questions');
      }
    } else {
      setMessage("Please enter email and password.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Freelancer Login</h1>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="border p-2 rounded"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        {message && <div className="text-red-500">{message}</div>}
        <button className="bg-green-500 text-white py-2 rounded hover:bg-green-600" type="submit">
          Log In
        </button>
      </form>
    </div>
  );
} 
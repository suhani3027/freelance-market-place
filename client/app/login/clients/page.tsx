"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '../../../lib/api';

export default function ClientLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setMessage("Please enter email and password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role || "client");
        localStorage.setItem("email", data.email || form.email);
        localStorage.setItem("name", data.name || data.user?.name || form.email.split("@")[0]);
        localStorage.setItem("profilePhoto", "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png");
        
        // Redirect based on role
        if (data.role === 'freelancer') {
          router.push("/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setMessage(data.message || data.error || "Login failed.");
      }
    } catch (err) {
      setMessage("Server error. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Client Login</h1>
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
        <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600" type="submit">
          Log In
        </button>
      </form>
    </div>
  );
} 
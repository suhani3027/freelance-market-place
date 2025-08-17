"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '../../../lib/api';
import { setAuthData } from '../../../lib/auth';

export default function ClientLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setMessage("Please enter email and password.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (res.ok) {
        // Validate tokens before storing
        if (!data.accessToken || !data.refreshToken) {
          setMessage("Invalid response from server - missing tokens.");
          return;
        }

        // Use the new authentication system
        const success = setAuthData(data.accessToken, data.refreshToken, {
          email: data.email || form.email,
          role: data.role || "client",
          name: data.name || data.user?.name || form.email.split("@")[0]
        });

        if (success) {
          // Redirect based on role
          if (data.role === 'freelancer') {
            router.push("/dashboard");
          } else {
            router.push("/dashboard");
          }
        } else {
          setMessage("Failed to store authentication data. Please try again.");
        }
      } else {
        setMessage(data.message || data.error || "Login failed.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage("Server error. Please try again.");
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        />
        <input
          className="border p-2 rounded"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          disabled={isLoading}
        />
        {message && <div className="text-red-500">{message}</div>}
        <button 
          className={`py-2 rounded text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`} 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
} 
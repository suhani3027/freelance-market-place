"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // Replace with real API call
    // For demo, accept any email/password
    if (form.email && form.password) {
      localStorage.setItem("token", "client-token");
      localStorage.setItem("role", "client");
      localStorage.setItem("email", form.email);
      localStorage.setItem("name", form.email.split("@")[0]);
      localStorage.setItem("profilePhoto", "https://via.placeholder.com/100?text=Client");
      router.push("/dashboard");
    } else {
      setMessage("Please enter email and password.");
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
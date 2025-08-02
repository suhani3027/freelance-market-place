"use client"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

 export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("Login successful");
      localStorage.setItem("token", data.token); // Save JWT
      localStorage.setItem("email", form.email); // Save email for clientId
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } else {
      setMessage(data.message);
    }
  };

  return(
    <div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-gray-300 rounded-md p-4 w-1/3 mx-auto mt-40">
        <h1 className="text-2xl font-bold text-center">Login</h1>
            <input type="text" placeholder="Username" value={form.email} onChange={handleChange} className="p-2 border border-gray-300 rounded-md w-full" />
            <input type="password" placeholder="Password" value={form.password} onChange={handleChange} className="p-2 border border-gray-300 rounded-md w-full" />
            <button type="submit" className="bg-blue-500 text-white p-2 rounded-md w-full mt-4">Login</button>
            <p className="text-center">Don't have an account? <Link href="/register" className="text-blue-500">Register</Link></p>
        </form>
        {message && <p>{message}</p>}
    </div>
  )
 }
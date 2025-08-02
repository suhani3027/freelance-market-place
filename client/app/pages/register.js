"use client"
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
  
    const handleChange = (e) =>
      setForm({ ...form, [e.target.name]: e.target.value });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message);
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    };

        return(
            <div>
                <h1>Register</h1>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Username" value={form.name} onChange={handleChange} />
                    <input type="email" placeholder="Email" value={form.email} onChange={handleChange} />
                    <input type="password" placeholder="Password" value={form.password} onChange={handleChange} />
                    <button type="submit">Register</button>
                    <p>Already have an account? <Link href="/login">Login</Link></p>
                </form>
                {message && <p>{message}</p>}
            </div>
        )
    };

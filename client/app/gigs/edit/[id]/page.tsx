"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditGigPage() {
  const router = useRouter();
  const params = useParams();
  const gigId = params?.id as string;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [technology, setTechnology] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/gigs/${gigId}`);
        if (!res.ok) throw new Error("Failed to fetch gig");
        const data = await res.json();
        setTitle(data.title);
        setAmount(data.amount);
        setTechnology(data.technology);
        setDuration(data.duration);
        setDescription(data.description);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    if (gigId) fetchGig();
  }, [gigId]);

  const clientId = localStorage.getItem('email') || 'demo-client@email.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/gigs/${gigId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, technology, duration, description, clientId }),
      });
      if (!res.ok) throw new Error("Failed to update gig");
      setSuccess("Gig updated successfully!");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Edit Gig</h1>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <textarea
          className="border p-2 rounded"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          type="number"
          placeholder="Amount (e.g. 500)"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          min={0}
          required
        />
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700" type="submit">
          Update Gig
        </button>
      </form>
    </div>
  );
} 
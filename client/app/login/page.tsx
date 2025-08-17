"use client";
import { useRouter } from "next/navigation";

export default function LoginChoice() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Sign in as a client or freelancer</h1>
      <div className="flex gap-8">
        <button
          className="border rounded-lg p-8 flex flex-col items-center hover:shadow-lg"
          onClick={() => router.push('/login/clients')}
        >
          <span className="text-4xl mb-2">👔</span>
          <span className="text-xl font-semibold">I&apos;m a client, hiring for a project</span>
        </button>
        <button
          className="border rounded-lg p-8 flex flex-col items-center hover:shadow-lg"
          onClick={() => router.push('/login/freelancer')}
        >
          <span className="text-4xl mb-2">💻</span>
          <span className="text-xl font-semibold">I&apos;m a freelancer, looking for work</span>
        </button>
      </div>
    </div>
  );
} 
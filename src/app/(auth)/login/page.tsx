"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Dance Club</h1>
          <p className="text-gray-400 text-sm mt-1">
            Availability Management System
          </p>
        </div>

        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-8">
          <h2 className="text-white text-base font-semibold mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>

        <p className="text-gray-600 text-xs text-center mt-6">
          Contact your Core Team admin if you need access
        </p>

      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    registerNumber: "",
    email: "",
    phone: "",
    department: "",
    academicYear: "1",
    category: "MEMBER",
    position: "",
    password: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/members");
  }

  return (
    <div>

      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4">
        <h1 className="text-lg font-semibold text-white">Add New Member</h1>
      </div>

      <div className="p-8 max-w-2xl">
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Full Name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} required placeholder="John Doe"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Register Number</label>
              <input name="registerNumber" value={form.registerNumber} onChange={handleChange} required placeholder="RA2211003010001"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm font-mono" />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Email Address</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@college.edu"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Phone Number <span className="text-gray-600 normal-case font-normal">(optional)</span>
              </label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Department</label>
              <input name="department" value={form.department} onChange={handleChange} required placeholder="CSE"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Academic Year</label>
                <select name="academicYear" value={form.academicYear} onChange={handleChange}
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm">
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Category</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm">
                  <option value="MEMBER">Normal Members</option>
                  <option value="CORE">Core Members</option>
                  <option value="FFCS">FFCS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Position</label>
              <input name="position" value={form.position} onChange={handleChange} required
                placeholder="e.g. President, Dance Captain, Choreographer"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                placeholder="Temporary login password"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {loading ? "Adding..." : "Add Member"}
              </button>
              <Link href="/members"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm text-center">
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
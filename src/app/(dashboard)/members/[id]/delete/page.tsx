"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function DeleteMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [member, setMember] = useState<{ fullName: string; email: string; registerNumber: string } | null>(null);

  useEffect(() => {
    fetch(`/api/members/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMember(data);
        setFetching(false);
      })
      .catch(() => {
        setError("Failed to load member data");
        setFetching(false);
      });
  }, [id]);

  async function handleDelete() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/members/${id}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (!res.ok) {
      setError("Failed to delete member");
      return;
    }

    router.push("/members");
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div>

      <div data-section="People" className="c-page-header flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Delete Member</h1>
        <Link
          href="/members"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back to Members
        </Link>
      </div>

      <div className="p-8 max-w-md">
        <div className="bg-[#17120f] border border-red-500/20 rounded-xl p-8">

          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center mb-5">
            <AlertTriangle size={18} className="text-red-400" />
          </div>

          <h2 className="text-white font-semibold text-base mb-2">
            Are you sure?
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            You are about to permanently delete this member. This action cannot
            be undone.
          </p>

          {member && (
            <div className="bg-[#0d0705] border border-gray-800 rounded-lg px-4 py-3 mb-6">
              <p className="text-white text-sm font-medium">{member.fullName}</p>
              <p className="text-gray-500 text-xs mt-0.5">{member.email}</p>
              <p className="text-gray-500 text-xs mt-0.5 font-mono">
                {member.registerNumber}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "Deleting..." : "Delete Member"}
            </button>
            <Link
              href="/members"
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm text-center"
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}
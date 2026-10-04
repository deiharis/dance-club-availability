"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Avatar } from "@/components/console/ui";

export default function DeleteMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [member, setMember] = useState<{
    fullName: string;
    email: string;
    registerNumber: string;
    department?: string;
    category?: string;
  } | null>(null);

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

    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      setError("Failed to delete member");
      return;
    }

    router.push("/members");
  }

  return (
    <div>
      <div data-section="People" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Delete member</h1>
          <p className="text-zinc-500 mt-0.5">This permanently removes the member and their login</p>
        </div>
        <Link
          href="/members"
          className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5"
        >
          Back to members
        </Link>
      </div>

      <div className="p-4 sm:p-8 max-w-lg">
        {fetching ? (
          <p className="py-16 text-center text-sm text-zinc-500">Loading...</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-b from-red-500/[0.06] to-transparent">
            <div className="p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h2 className="text-base font-bold text-white">Are you sure?</h2>
              <p className="mt-1.5 text-sm text-zinc-400">
                This also removes their timetable, attendance, reports and OD requests. It cannot be undone.
              </p>

              {member && (
                <div className="mt-5 flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
                  <Avatar name={member.fullName} size={10} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{member.fullName}</p>
                    <p className="truncate text-xs text-zinc-500">{member.email}</p>
                    <p className="font-mono text-[11px] text-zinc-500">{member.registerNumber}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-red-500/20 bg-black/20 px-6 py-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete member"}
              </button>
              <Link
                href="/members"
                className="flex-1 rounded-md border border-zinc-700 py-2.5 text-center text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5"
              >
                Cancel
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

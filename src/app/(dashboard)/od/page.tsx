"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";

interface ODRequest {
  id: string;
  reason: string;
  activityDate: string;
  slots: string[];
  status: string;
  approvedAt: string | null;
  createdAt: string;
  member: {
    fullName: string;
    registerNumber: string;
    department: string;
    category: string;
    position: string;
  };
  report: {
    description: string;
    workDate: string;
  };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md">
        <CheckCircle size={12} />
        Approved
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-md">
      <Clock size={12} />
      Pending
    </span>
  );
}

export default function ODManagementPage() {
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  function loadRequests() {
    setLoading(true);
    fetch("/api/od", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setRequests(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleApprove(id: string) {
    setActionLoading(id);
    setError("");

    const res = await fetch(`/api/od/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    });

    const data = await res.json();
    setActionLoading(null);

    if (!res.ok) {
      setError(data.error || "Failed to approve OD request");
      return;
    }

    loadRequests();
  }

  const filtered = requests.filter((r) =>
    filter === "ALL" ? true : r.status === filter
  );

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div>

      <div className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-white">
            OD Requests
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Approve OD requests after college grants them
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-3 py-1 rounded-full border border-yellow-500/30">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="p-4 sm:p-8">

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["PENDING", "ALL", "APPROVED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f
                  ? "bg-white/5 border-gray-600 text-white"
                  : "border-gray-800 text-gray-500 hover:text-gray-300"
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
              {f === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 bg-yellow-500/30 text-yellow-400 px-1.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Loading OD requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-12 text-center">
            <FileText size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No OD requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-6"
              >
                {/* Member info */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-xs font-semibold">
                        {req.member.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {req.member.fullName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {req.member.registerNumber} · {req.member.department} · {req.member.position}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {/* OD details */}
                <div className="bg-[#0f1117] border border-gray-800 rounded-lg p-4 mb-4 space-y-2">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                      Activity Date
                    </p>
                    <p className="text-white text-sm">
                      {new Date(req.activityDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                      OD Reason
                    </p>
                    <p className="text-white text-sm">{req.reason}</p>
                  </div>

                  {req.slots && req.slots.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1.5">
                        Requested Time Slots
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {req.slots.map((slot) => (
                          <span
                            key={slot}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                      Linked Report
                    </p>
                    <p className="text-gray-300 text-sm">{req.report.description}</p>
                  </div>
                </div>

                {/* Approve action */}
                {req.status === "PENDING" && (
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle size={14} />
                    {actionLoading === req.id
                      ? "Approving..."
                      : "Mark as Approved"}
                  </button>
                )}

                {req.status === "APPROVED" && req.approvedAt && (
                  <p className="text-green-400 text-xs">
                    Approved on{" "}
                    {new Date(req.approvedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}

                <p className="text-gray-600 text-xs mt-2">
                  Requested on{" "}
                  {new Date(req.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
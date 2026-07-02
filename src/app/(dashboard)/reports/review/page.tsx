"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";

interface Report {
  id: string;
  description: string;
  workDate: string;
  imageUrl: string;
  status: string;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  member: {
  fullName: string;
  registerNumber: string;
  category: string;
  position: string;
  isFFCS: boolean;
};
  reviewedBy: { fullName: string } | null;
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
  if (status === "REJECTED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
        <XCircle size={12} />
        Rejected
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

export default function ReviewReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  function loadReports() {
    setLoading(true);
    fetch("/api/reports", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleAction(id: string, action: "APPROVE" | "REJECT") {
    setActionLoading(true);
    setError("");

    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNotes }),
    });

    const data = await res.json();
    setActionLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setReviewingId(null);
    setReviewNotes("");
    loadReports();
  }

  const filtered = reports.filter((r) =>
    filter === "ALL" ? true : r.status === filter
  );

  const pendingCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div>
<div className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4 flex items-center justify-between">        <div>
          <h1 className="text-lg font-semibold text-white">Reports</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Review and approve member work reports
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
          {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map((f) => (
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
            <p className="text-gray-500 text-sm">Loading reports...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-sm">No reports found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((report) => (
              <div
                key={report.id}
                className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 text-xs font-semibold">
                        {report.member.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {report.member.fullName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-gray-500 text-xs">
                        {report.member.registerNumber} · {report.member.position}
                      </span>
                      {report.member.isFFCS && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/20">
                          FFCS
                        </span>
                      )}
                    </div>
                    </div>
                  </div>
                  <StatusBadge status={report.status} />
                </div>

                <div className="bg-[#0f1117] border border-gray-800 rounded-lg p-4 mb-4">
                  <p className="text-white text-sm">{report.description}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Work date:{" "}
                    {new Date(report.workDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Image — only shown for PENDING reports */}
                {report.status === "PENDING" && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">
                      Proof Image
                    </p>
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt="Report proof"
                        className="max-h-64 rounded-lg border border-gray-800 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const msg = document.createElement("p");
                            msg.className = "text-red-400 text-xs";
                            msg.textContent = "Image could not be loaded. It may have expired.";
                            parent.appendChild(msg);
                          }
                        }}
                      />
                    ) : (
                      <p className="text-gray-500 text-xs">
                        Image not available
                      </p>
                    )}
                  </div>
                )}

                {report.status === "REJECTED" && report.reviewNotes && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                    <p className="text-red-400 text-xs">
                      Rejection reason: {report.reviewNotes}
                    </p>
                  </div>
                )}

                {report.reviewedBy && (
                  <p className="text-gray-600 text-xs mb-4">
                    Reviewed by {report.reviewedBy.fullName} on{" "}
                    {report.reviewedAt
                      ? new Date(report.reviewedAt).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                )}

                {/* Review Actions — only for PENDING */}
                {report.status === "PENDING" && (
                  <div>
                    {reviewingId === report.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          rows={2}
                          className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(report.id, "APPROVE")}
                            disabled={actionLoading}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(report.id, "REJECT")}
                            disabled={actionLoading || reviewNotes.trim() === ""}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setReviewingId(null);
                              setReviewNotes("");
                              setError("");
                            }}
                            className="text-gray-400 hover:text-white text-sm px-4 py-2 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(report.id)}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
                      >
                        Review this report
                      </button>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
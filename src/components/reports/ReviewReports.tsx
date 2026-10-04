"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { StatusChip } from "@/components/console/ui";

interface Report {
  id: string;
  area?: "COMMITTEE" | "DANCE" | null;
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
    position: string | null;
    team?: string | null;
    isFFCS: boolean;
  };
  reviewedBy: {
    fullName: string;
    position: string | null;
    category: string;
  } | null;
}

type Filter = "PENDING" | "ALL" | "APPROVED" | "REJECTED";

// One review screen, two skins: "console" for the Working Committee (violet, flat) and
// "stage" for Dance Leads inside Dance Floor (glass, orange). Same behaviour in both.
const SKIN = {
  console: {
    card: "rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent",
    pendingEdge: "border-l-2 border-l-amber-400/70",
    approvedEdge: "border-l-2 border-l-emerald-400/70",
    rejectedEdge: "border-l-2 border-l-red-400/70",
    divider: "border-white/10",
    footer: "bg-white/[0.02]",
    label: "text-zinc-500",
    muted: "text-zinc-400",
    strong: "text-white",
    inner: "rounded-md border border-white/10 bg-black/30",
    avatar: "rounded bg-zinc-800 text-zinc-300",
    tabWrap: "inline-flex rounded-lg border border-zinc-800 bg-black/30 p-1",
    tabOn: "rounded-md bg-violet-600 text-white",
    tabOff: "rounded-md text-zinc-400 hover:text-white",
    link: "text-violet-300 hover:text-violet-200",
    input: "rounded-md border border-zinc-700 bg-black/40",
    ghost: "rounded-md text-zinc-400 hover:text-white",
    btn: "rounded-md",
  },
  stage: {
    card: "rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    pendingEdge: "",
    approvedEdge: "",
    rejectedEdge: "",
    divider: "border-white/10",
    footer: "bg-white/[0.02]",
    label: "text-orange-100/45",
    muted: "text-orange-100/60",
    strong: "text-white",
    inner: "rounded-2xl border border-white/10 bg-black/30",
    avatar: "rounded-full bg-gradient-to-b from-orange-300 to-orange-600 text-white",
    tabWrap: "inline-flex rounded-full border border-white/10 bg-black/30 p-1",
    tabOn: "rounded-full bg-orange-500 text-white shadow-[0_0_20px_-6px_rgba(249,115,22,0.8)]",
    tabOff: "rounded-full text-orange-100/60 hover:text-white",
    link: "text-amber-300 hover:text-amber-200",
    input: "rounded-2xl border border-white/10 bg-black/30",
    ghost: "rounded-full text-orange-100/60 hover:text-white",
    btn: "rounded-full",
  },
} as const;

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ReviewReports({
  variant,
  canViewDancers = false,
}: {
  variant: "console" | "stage";
  // SuperAdmin only: adds a view-only list of normal dancers' reports (their Lead decides them).
  canViewDancers?: boolean;
}) {
  const s = SKIN[variant];
  const [scope, setScope] = useState<"queue" | "dancers">("queue");
  const viewOnly = scope === "dancers";
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  function loadReports() {
    setLoading(true);
    fetch(`/api/reports${viewOnly ? "?scope=dancers" : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    setReviewingId(null);
    setFilter(viewOnly ? "ALL" : "PENDING");
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

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

  const count = (st: string) => reports.filter((r) => r.status === st).length;
  const filtered = reports.filter((r) => (filter === "ALL" ? true : r.status === filter));
  const tabs: { key: Filter; label: string; n: number }[] = [
    { key: "PENDING", label: "Pending", n: count("PENDING") },
    { key: "APPROVED", label: "Approved", n: count("APPROVED") },
    { key: "REJECTED", label: "Rejected", n: count("REJECTED") },
    { key: "ALL", label: "All", n: reports.length },
  ];

  return (
    <div>
      {canViewDancers && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className={s.tabWrap}>
            {([
              { key: "queue", label: "Needs a decision" },
              { key: "dancers", label: "Dancer reports (view only)" },
            ] as const).map((o) => (
              <button
                key={o.key}
                onClick={() => setScope(o.key)}
                className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  scope === o.key ? s.tabOn : s.tabOff
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {viewOnly && (
            <p className={`text-xs ${s.muted}`}>Dancers&apos; reports are approved by their own Team Leader.</p>
          )}
        </div>
      )}

      <div className={`mb-6 overflow-x-auto ${s.tabWrap}`}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === t.key ? s.tabOn : s.tabOff
            }`}
          >
            {t.label}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                filter === t.key ? "bg-white/20 text-white" : "bg-white/10 text-inherit"
              }`}
            >
              {t.n}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <p className={`py-12 text-center text-sm ${s.muted}`}>Loading reports...</p>
      ) : filtered.length === 0 ? (
        <div className={`${s.card} p-14 text-center`}>
          <p className={`text-sm ${s.muted}`}>
            {filter === "PENDING" ? "Nothing waiting for review." : "No reports found."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const pending = report.status === "PENDING";
            const edge =
              report.status === "APPROVED"
                ? s.approvedEdge
                : report.status === "REJECTED"
                ? s.rejectedEdge
                : s.pendingEdge;
            return (
              <article key={report.id} className={`${s.card} ${edge} overflow-hidden`}>
                <header className={`flex items-start justify-between gap-4 border-b px-5 py-4 ${s.divider}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center text-xs font-semibold ${s.avatar}`}>
                      {report.member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-bold ${s.strong}`}>{report.member.fullName}</p>
                      <p className={`flex flex-wrap items-center gap-x-2 text-xs ${s.label}`}>
                        <span className="font-mono">{report.member.registerNumber}</span>
                        {report.member.position && <span>· {report.member.position}</span>}
                        {viewOnly && report.member.team && (
                          <span className="rounded bg-pink-500/15 px-1.5 py-0.5 text-[10px] font-medium text-pink-300">
                            {report.member.team}
                          </span>
                        )}
                        {/* A committee member who also dances: say what this report is about */}
                        {report.member.category !== "DANCER" && report.area === "DANCE" && (
                          <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium text-orange-300">
                            Dance team
                          </span>
                        )}
                        {report.member.isFFCS && (
                          <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-medium text-teal-300">FFCS</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {report.status === "APPROVED" ? (
                    <StatusChip tone="green" icon={<CheckCircle size={12} />}>Approved</StatusChip>
                  ) : report.status === "REJECTED" ? (
                    <StatusChip tone="red" icon={<XCircle size={12} />}>Rejected</StatusChip>
                  ) : (
                    <StatusChip tone="amber" icon={<Clock size={12} />}>Pending</StatusChip>
                  )}
                </header>

                <div className="space-y-4 px-5 py-4">
                  <div className={`${s.inner} p-4`}>
                    <p className={`text-sm ${s.strong}`}>{report.description}</p>
                    <p className={`mt-2 text-xs ${s.label}`}>Work date: {fmt(report.workDate)}</p>
                  </div>

                  {/* Proof image: only for pending reports (deleted after review) */}
                  {pending && !viewOnly && (
                    <div>
                      <p className={`mb-2 text-[10px] font-semibold uppercase tracking-widest ${s.label}`}>
                        Proof image
                      </p>
                      {report.imageUrl ? (
                        <img
                          src={report.imageUrl}
                          alt="Report proof"
                          className="max-h-64 rounded-xl border border-white/10 object-contain"
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
                        <p className={`text-xs ${s.muted}`}>Image not available</p>
                      )}
                    </div>
                  )}

                  {report.status === "REJECTED" && report.reviewNotes && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                      <p className="text-xs text-red-300">Rejection reason: {report.reviewNotes}</p>
                    </div>
                  )}

                  {report.reviewedBy && (
                    <p className={`text-xs ${s.muted}`}>
                      <span className={`font-semibold ${s.strong}`}>{report.reviewedBy.fullName}</span>
                      {report.reviewedBy.position && ` · ${report.reviewedBy.position}`}
                      {` · Verified ${report.reviewedAt ? fmt(report.reviewedAt) : ""}`}
                    </p>
                  )}
                </div>

                <footer className={`border-t px-5 py-3 ${s.divider} ${s.footer}`}>
                  {pending && !viewOnly ? (
                    reviewingId === report.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Rejection reason (needed to reject)"
                          rows={2}
                          className={`w-full resize-none px-3 py-2 text-sm text-white placeholder-zinc-600 ${s.input}`}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAction(report.id, "APPROVE")}
                            disabled={actionLoading}
                            className={`flex items-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 ${s.btn}`}
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(report.id, "REJECT")}
                            disabled={actionLoading || reviewNotes.trim() === ""}
                            className={`flex items-center gap-2 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50 ${s.btn}`}
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
                            className={`px-4 py-2 text-sm transition-colors ${s.ghost}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(report.id)}
                        className={`text-sm font-semibold transition-colors ${s.link}`}
                      >
                        Review this report
                      </button>
                    )
                  ) : (
                    <p className={`text-[11px] ${s.label}`}>Submitted {fmt(report.submittedAt)}</p>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

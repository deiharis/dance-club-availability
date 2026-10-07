"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Inbox, Maximize2, ImageOff } from "lucide-react";
import { StatusChip } from "@/components/console/ui";
import { useToast } from "@/components/ui/feedback";
import { Skeleton, EmptyState } from "@/components/ui/states";

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
  // SuperAdmin and Advisory: adds a view-only list of normal dancers' reports (their Lead decides them).
  canViewDancers?: boolean;
}) {
  const s = SKIN[variant];
  const stage = variant === "stage";
  const toast = useToast();
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<"queue" | "dancers">("queue");
  const viewOnly = scope === "dancers";
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // silent: refresh after a decision without blanking the list (keeps your scroll position).
  function loadReports(silent = false) {
    if (!silent) setLoading(true);
    fetch(`/api/reports${viewOnly ? "?scope=dancers" : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Could not load reports", "Check your connection and refresh the page."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setReviewingId(null);
    setFilter(viewOnly ? "ALL" : "PENDING");
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  async function handleAction(report: Report, action: "APPROVE" | "REJECT") {
    setActionLoading(report.id);
    const res = await fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNotes: action === "REJECT" ? reviewNotes : "" }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setActionLoading(null);

    if (!res?.ok) {
      toast.error("Decision not saved", data.error || "Check your connection and try again.");
      return;
    }
    const first = report.member.fullName.split(" ")[0];
    toast.success(action === "APPROVE" ? "Report approved" : "Report rejected", `${first} has been notified.`);
    // Show the new status straight away; the silent reload then fills in the reviewer.
    setReports((list) => list.map((r) => (r.id === report.id ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r)));
    setReviewingId(null);
    setReviewNotes("");
    loadReports(true);
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

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading reports">
          {[0, 1].map((i) => (
            <Skeleton key={i} stage={stage} className="h-48 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          stage={stage}
          icon={filter === "PENDING" ? CheckCircle : Inbox}
          title={filter === "PENDING" ? "All caught up" : "No reports here"}
          body={
            filter === "PENDING"
              ? viewOnly
                ? "No dancer reports are waiting for their Team Leaders."
                : "Nothing is waiting for a decision. New reports appear here as soon as they are submitted."
              : "Reports with this status will appear here."
          }
        />
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
                      {report.imageUrl && !brokenImages.has(report.id) ? (
                        <a
                          href={report.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative inline-block"
                          aria-label={`Open ${report.member.fullName}'s proof image full size`}
                        >
                          <img
                            src={report.imageUrl}
                            alt={`Proof for ${report.member.fullName}'s report`}
                            className="max-h-64 rounded-xl border border-white/10 object-contain"
                            onError={() => setBrokenImages((b) => new Set(b).add(report.id))}
                          />
                          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Maximize2 size={11} aria-hidden="true" /> Full size
                          </span>
                        </a>
                      ) : (
                        <p className={`flex items-center gap-1.5 text-xs ${s.muted}`}>
                          <ImageOff size={13} aria-hidden="true" />
                          {report.imageUrl ? "The image link has expired. Refresh the page to load it again." : "Image not available"}
                        </p>
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
                        <label className={`block text-xs ${s.muted}`} htmlFor={`reason-${report.id}`}>
                          Why is it rejected? {report.member.fullName.split(" ")[0]} will see this.
                        </label>
                        <textarea
                          id={`reason-${report.id}`}
                          autoFocus
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="e.g. The photo does not show the work described"
                          rows={2}
                          className={`w-full resize-none px-3 py-2 text-sm text-white placeholder-zinc-600 ${s.input}`}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleAction(report, "REJECT")}
                            disabled={actionLoading === report.id || reviewNotes.trim() === ""}
                            className={`press flex items-center gap-2 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50 ${s.btn}`}
                          >
                            <XCircle size={14} aria-hidden="true" />
                            {actionLoading === report.id ? "Rejecting..." : "Reject report"}
                          </button>
                          <button
                            onClick={() => {
                              setReviewingId(null);
                              setReviewNotes("");
                            }}
                            className={`px-4 py-2 text-sm transition-colors ${s.ghost}`}
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleAction(report, "APPROVE")}
                          disabled={actionLoading === report.id}
                          className={`press flex items-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 ${s.btn}`}
                        >
                          <CheckCircle size={14} aria-hidden="true" />
                          {actionLoading === report.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(report.id);
                            setReviewNotes("");
                          }}
                          disabled={actionLoading === report.id}
                          className={`press flex items-center gap-2 border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50 ${s.btn}`}
                        >
                          <XCircle size={14} aria-hidden="true" />
                          Reject...
                        </button>
                        <span className={`ml-auto text-[11px] ${s.label}`}>Submitted {fmt(report.submittedAt)}</span>
                      </div>
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

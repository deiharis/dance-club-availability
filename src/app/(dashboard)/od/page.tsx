"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle, Clock, FileBadge, Copy } from "lucide-react";
import { panel, Tabs, StatusChip, Field, Avatar, stripe, dateIN, control } from "@/components/console/ui";
import { useToast } from "@/components/ui/feedback";
import { Skeleton, EmptyState } from "@/components/ui/states";

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
    position: string | null;
  };
  report: {
    description: string;
    workDate: string;
  };
  event: {
    id: string;
    name: string;
    eventDate: string;
  } | null;
}

export default function ODManagementPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED">("PENDING");
  const [eventId, setEventId] = useState(""); // "" = every event
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function loadRequests(silent = false) {
    if (!silent) setLoading(true);
    fetch("/api/od", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Could not load OD requests", "Check your connection and refresh the page."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(req: ODRequest) {
    setActionLoading(req.id);
    const res = await fetch(`/api/od/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setActionLoading(null);

    if (!res?.ok) {
      toast.error("OD not approved", data.error || "Check your connection and try again.");
      return;
    }
    toast.success("OD marked as approved", `It now shows as approved on ${req.member.fullName.split(" ")[0]}'s OD tab.`);
    setRequests((list) => list.map((r) => (r.id === req.id ? { ...r, status: "APPROVED", approvedAt: new Date().toISOString() } : r)));
    loadRequests(true);
  }

  const events = useMemo(() => {
    const byId = new Map<string, NonNullable<ODRequest["event"]>>();
    requests.forEach((r) => r.event && byId.set(r.event.id, r.event));
    return Array.from(byId.values()).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  }, [requests]);

  const forEvent = requests.filter((r) => !eventId || r.event?.id === eventId);
  const filtered = forEvent.filter((r) => (filter === "ALL" ? true : r.status === filter));
  const pendingCount = forEvent.filter((r) => r.status === "PENDING").length;
  const approvedCount = forEvent.length - pendingCount;

  // A plain list to paste into an email or message for the college.
  async function copyList() {
    const lines = filtered.map(
      (r, i) =>
        `${i + 1}. ${r.member.fullName} (${r.member.registerNumber}) - ${dateIN(r.activityDate)}${r.slots?.length ? ` - ${r.slots.join(", ")}` : ""}`
    );
    const event = events.find((e) => e.id === eventId);
    const text = (event ? `${event.name} (${dateIN(event.eventDate)})\n` : "") + lines.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${filtered.length} request${filtered.length === 1 ? "" : "s"}`, "Paste them into an email or message for the college.");
    } catch {
      toast.error("Could not copy", "Your browser blocked the clipboard.");
    }
  }

  return (
    <div>
      <div data-section="Super admin" className="c-page-header">
        <h1 className="text-white">OD requests</h1>
        <p className="text-zinc-500 mt-0.5">Approve each request after the college grants it</p>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Tabs
            value={filter}
            onChange={setFilter}
            options={[
              { key: "PENDING", label: "Pending", count: pendingCount },
              { key: "APPROVED", label: "Approved", count: approvedCount },
              { key: "ALL", label: "All", count: forEvent.length },
            ]}
          />
          {events.length > 0 && (
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="Filter by event" className={`${control} !w-auto !py-1.5`}>
              <option value="">Every event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {dateIN(e.eventDate)}
                </option>
              ))}
            </select>
          )}
          {filtered.length > 0 && (
            <button
              onClick={copyList}
              className="press ml-auto flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-white/5"
            >
              <Copy size={13} aria-hidden="true" />
              Copy list ({filtered.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading OD requests">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={filter === "PENDING" ? CheckCircle : FileBadge}
            title={filter === "PENDING" ? "Nothing waiting for approval" : "No OD requests here"}
            body={
              filter === "PENDING"
                ? "Members request OD from an approved report. New requests appear here."
                : "Requests with this status will appear here."
            }
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const pending = req.status === "PENDING";
              return (
                <article key={req.id} className={`${panel} ${pending ? stripe.amber : stripe.green} overflow-hidden`}>
                  <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={req.member.fullName} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{req.member.fullName}</p>
                        <p className="truncate text-xs text-zinc-500">
                          <span className="font-mono">{req.member.registerNumber}</span> · {req.member.department}
                          {req.member.position ? ` · ${req.member.position}` : ""}
                        </p>
                      </div>
                    </div>
                    {pending ? (
                      <StatusChip tone="amber" icon={<Clock size={12} />}>Pending</StatusChip>
                    ) : (
                      <StatusChip tone="green" icon={<CheckCircle size={12} />}>Approved</StatusChip>
                    )}
                  </header>

                  <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                    <Field label="Activity date">{dateIN(req.activityDate)}</Field>
                    <Field label="Event">
                      {req.event ? (
                        <>
                          {req.event.name}
                          <span className="text-zinc-500"> · {dateIN(req.event.eventDate)}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500">Not set (the event was deleted)</span>
                      )}
                    </Field>
                    <Field label="Reason" className="sm:col-span-2">{req.reason}</Field>
                    {req.slots && req.slots.length > 0 && (
                      <Field label={`Requested time slots (${req.slots.length})`} className="sm:col-span-2">
                        <div className="flex flex-wrap gap-1.5">
                          {req.slots.map((slot) => (
                            <span key={slot} className="rounded bg-violet-500/15 px-2 py-1 text-xs font-medium text-violet-200">
                              {slot}
                            </span>
                          ))}
                        </div>
                      </Field>
                    )}
                    <Field label="Linked report" className="sm:col-span-2">
                      <span className="text-zinc-300">{req.report.description}</span>
                    </Field>
                  </div>

                  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-3">
                    <p className="text-[11px] text-zinc-500">
                      Requested {dateIN(req.createdAt)}
                      {req.approvedAt && ` · Approved ${dateIN(req.approvedAt)}`}
                    </p>
                    {pending && (
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={actionLoading === req.id}
                        className="press flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle size={14} aria-hidden="true" />
                        {actionLoading === req.id ? "Approving..." : "Mark as approved"}
                      </button>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

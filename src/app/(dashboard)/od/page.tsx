"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { panel, Tabs, StatusChip, Field, Avatar, stripe, dateIN } from "@/components/console/ui";

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

  const filtered = requests.filter((r) => (filter === "ALL" ? true : r.status === filter));
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.length - pendingCount;

  return (
    <div>
      <div data-section="Super admin" className="c-page-header">
        <h1 className="text-white">OD requests</h1>
        <p className="text-zinc-500 mt-0.5">Approve each request after the college grants it</p>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl">
        <div className="mb-6">
          <Tabs
            value={filter}
            onChange={setFilter}
            options={[
              { key: "PENDING", label: "Pending", count: pendingCount },
              { key: "APPROVED", label: "Approved", count: approvedCount },
              { key: "ALL", label: "All", count: requests.length },
            ]}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading OD requests...</p>
        ) : filtered.length === 0 ? (
          <div className={`${panel} p-14 text-center`}>
            <FileText size={28} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-sm text-zinc-400">
              {filter === "PENDING" ? "Nothing waiting for approval." : "No OD requests found."}
            </p>
          </div>
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
                        <span className="text-zinc-500">Not set</span>
                      )}
                    </Field>
                    <Field label="Reason" className="sm:col-span-2">{req.reason}</Field>
                    {req.slots && req.slots.length > 0 && (
                      <Field label="Requested time slots" className="sm:col-span-2">
                        <div className="flex flex-wrap gap-1.5">
                          {req.slots.map((slot) => (
                            <span
                              key={slot}
                              className="rounded bg-violet-500/15 px-2 py-1 text-xs font-medium text-violet-200"
                            >
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

                  <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-3">
                    <p className="text-[11px] text-zinc-500">
                      Requested {dateIN(req.createdAt)}
                      {req.approvedAt && ` · Approved ${dateIN(req.approvedAt)}`}
                    </p>
                    {pending && (
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <CheckCircle size={14} />
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

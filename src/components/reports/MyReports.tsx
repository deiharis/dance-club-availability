"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, CheckCircle, XCircle, Clock, FileBadge } from "lucide-react";
import { StatusChip } from "@/components/console/ui";

interface Report {
  id: string;
  description: string;
  workDate: string;
  status: string;
  reviewNotes: string | null;
  submittedAt: string;
}

interface ApprovedReport {
  id: string;
  description: string;
  workDate: string;
  odRequest: { id: string; status: string } | null;
}

interface ODRequest {
  id: string;
  reason: string;
  activityDate: string;
  slots: string[];
  status: string;
  approvedAt: string | null;
  report: { description: string; workDate: string };
  event: { id: string; name: string; eventDate: string } | null;
}

interface Event {
  id: string;
  name: string;
  eventDate: string;
}

// One screen, two skins: "member" (violet console, used by Core and Normal Members) and
// "stage" (glass and orange, used by dancers inside Dance Floor). Dancers get reports only
// (`showOd` false); OD is for Core and Normal Members.
const SKIN = {
  member: {
    panel: "rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent",
    divider: "border-white/10",
    label: "mb-1.5 block text-[11px] font-medium text-zinc-400",
    input: "w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-zinc-600",
    title: "text-[10px] font-semibold uppercase tracking-widest text-violet-400",
    muted: "text-zinc-500",
    faint: "text-zinc-600",
    strong: "text-white",
    primary:
      "w-full rounded-md bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(124,58,237,0.9)] transition-colors hover:bg-violet-500 disabled:opacity-50",
    tabWrap: "inline-flex rounded-lg border border-zinc-800 bg-black/30 p-1",
    tabOn: "rounded-md bg-violet-600 text-white",
    tabOff: "rounded-md text-zinc-400 hover:text-white",
    accent: "text-violet-300",
    drop: "rounded-lg border-2 border-dashed border-zinc-700 hover:border-violet-400/60",
    slotOn: "border-violet-400/40 bg-violet-500/15",
    slotOff: "border-transparent hover:bg-white/5",
    chip: "rounded bg-violet-500/15 px-2 py-0.5 text-xs text-violet-200",
    box: "rounded-md border border-zinc-700 bg-black/30",
    check: "accent-violet-500",
  },
  stage: {
    panel:
      "rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    divider: "border-white/10",
    label: "mb-1.5 block text-[11px] font-medium text-orange-100/55",
    input: "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder-orange-100/30 focus:border-orange-400/70 focus:outline-none",
    title: "text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-100/50",
    muted: "text-orange-100/55",
    faint: "text-orange-100/35",
    strong: "text-white",
    primary:
      "w-full rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] transition-colors hover:bg-orange-400 disabled:opacity-50",
    tabWrap: "inline-flex rounded-full border border-white/10 bg-black/30 p-1",
    tabOn: "rounded-full bg-orange-500 text-white",
    tabOff: "rounded-full text-orange-100/60 hover:text-white",
    accent: "text-amber-300",
    drop: "rounded-2xl border-2 border-dashed border-white/15 hover:border-orange-400/60",
    slotOn: "border-orange-400/40 bg-orange-500/15",
    slotOff: "border-transparent hover:bg-white/5",
    chip: "rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs text-orange-200",
    box: "rounded-2xl border border-white/10 bg-black/30",
    check: "accent-orange-500",
  },
} as const;

const SLOT_TIMES = [
  { label: "T1", time: "08:00 AM to 08:50 AM" },
  { label: "T2", time: "08:55 AM to 09:45 AM" },
  { label: "T3", time: "09:50 AM to 10:40 AM" },
  { label: "T4", time: "10:45 AM to 11:35 AM" },
  { label: "T5", time: "11:40 AM to 12:30 PM" },
  { label: "T6", time: "12:35 PM to 01:25 PM" },
  { label: "Lunch", time: "01:25 PM to 02:00 PM" },
  { label: "T7", time: "02:00 PM to 02:50 PM" },
  { label: "T8", time: "02:55 PM to 03:45 PM" },
  { label: "T9", time: "03:50 PM to 04:40 PM" },
  { label: "T10", time: "04:45 PM to 05:35 PM" },
  { label: "T11", time: "05:40 PM to 06:30 PM" },
  { label: "T12", time: "06:35 PM to 07:25 PM" },
];

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type Tab = "submit" | "od";

export default function MyReports({
  variant,
  showOd,
}: {
  variant: "member" | "stage";
  showOd: boolean;
}) {
  const s = SKIN[variant];
  const [activeTab, setActiveTab] = useState<Tab>("submit");
  const [reports, setReports] = useState<Report[]>([]);
  const [approvedReports, setApprovedReports] = useState<ApprovedReport[]>([]);
  const [odRequests, setODRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [odSubmitting, setODSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [odError, setODError] = useState("");
  const [odSuccess, setODSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [canRequestOD, setCanRequestOD] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  const [odForm, setODForm] = useState({
    reportId: "",
    reason: "",
    slots: [] as string[],
    eventId: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ description: "", workDate: "" });

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch("/api/reports/mine", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/reports/approved", { cache: "no-store" }).then((r) => r.json()),
      showOd ? fetch("/api/od", { cache: "no-store" }).then((r) => r.json()) : Promise.resolve([]),
      showOd ? fetch("/api/events", { cache: "no-store" }).then((r) => r.json()) : Promise.resolve([]),
    ]).then(([myReports, approved, myODs, eventList]) => {
      setReports(Array.isArray(myReports) ? myReports : []);
      const approvedList = Array.isArray(approved) ? approved : [];
      setApprovedReports(approvedList);
      setCanRequestOD(approvedList.some((r: ApprovedReport) => !r.odRequest));
      setODRequests(Array.isArray(myODs) ? myODs : []);
      setEvents(Array.isArray(eventList) ? eventList : []);
      setLoading(false);
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please attach an image as proof.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("description", form.description);
    formData.append("workDate", form.workDate);
    formData.append("image", file);

    const res = await fetch("/api/reports", { method: "POST", body: formData });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to submit report");
      return;
    }

    setSuccess(
      showOd
        ? "Report submitted. Once approved, you can request an OD for it."
        : "Report submitted. Your Team Leader will review it."
    );
    setForm({ description: "", workDate: "" });
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
    loadAll();
  }

  async function handleRequestOD(e: React.FormEvent) {
    e.preventDefault();
    setODError("");
    setODSuccess("");

    if (!odForm.reportId || !odForm.reason.trim()) {
      setODError("Please select a report and enter a reason.");
      return;
    }
    if (!odForm.eventId) {
      setODError("Please select an event for this OD request.");
      return;
    }

    setODSubmitting(true);
    const res = await fetch("/api/od", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(odForm),
    });
    const data = await res.json();
    setODSubmitting(false);

    if (!res.ok) {
      setODError(data.error || "Failed to submit OD request");
      return;
    }

    setODSuccess("OD request submitted. The Super Admin will mark it as approved once the college grants the OD.");
    setODForm({ reportId: "", reason: "", slots: [], eventId: "" });
    loadAll();
  }

  const eligibleReports = approvedReports.filter((r) => !r.odRequest);
  const pendingOd = odRequests.filter((o) => o.status === "PENDING").length;

  const Alert = ({ tone, children }: { tone: "red" | "green"; children: React.ReactNode }) => (
    <div
      className={`rounded-xl border px-4 py-3 ${
        tone === "red" ? "border-red-500/20 bg-red-500/10" : "border-green-500/20 bg-green-500/10"
      }`}
    >
      <p className={`text-sm ${tone === "red" ? "text-red-400" : "text-green-400"}`}>{children}</p>
    </div>
  );

  const reportChip = (status: string) =>
    status === "APPROVED" ? (
      <StatusChip tone="green" icon={<CheckCircle size={12} />}>Approved</StatusChip>
    ) : status === "REJECTED" ? (
      <StatusChip tone="red" icon={<XCircle size={12} />}>Rejected</StatusChip>
    ) : (
      <StatusChip tone="amber" icon={<Clock size={12} />}>Pending</StatusChip>
    );

  return (
    <div className="space-y-6">
      {showOd && (
        <div className={s.tabWrap}>
          {(
            [
              { key: "submit", label: "Reports", icon: FileText, count: 0 },
              { key: "od", label: "OD requests", icon: FileBadge, count: pendingOd },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const on = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold transition-colors ${on ? s.tabOn : s.tabOff}`}
              >
                <Icon size={14} />
                {t.label}
                {t.count > 0 && (
                  <span className="rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] tabular-nums text-amber-200">{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Reports ── */}
      {activeTab === "submit" && (
        <>
          <section className={`${s.panel} p-5 sm:p-6`}>
            <h2 className={s.title}>Submit a new report</h2>
            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label className={s.label}>Work description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Briefly describe the work you completed"
                  className={`${s.input} resize-none`}
                />
              </div>

              <div>
                <label className={s.label}>Date of work</label>
                <input
                  type="date"
                  value={form.workDate}
                  onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                  required
                  className={`${s.input} [color-scheme:dark]`}
                />
              </div>

              <div>
                <label className={s.label}>
                  Proof image <span className="text-red-400">(required)</span>
                </label>
                <div
                  className={`cursor-pointer p-6 text-center transition-colors ${s.drop}`}
                  onClick={() => fileRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 rounded-xl object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className={s.muted} />
                      <p className={`text-sm ${s.muted}`}>Click to upload an image</p>
                      <p className={`text-xs ${s.faint}`}>JPG, PNG or HEIC</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {error && <Alert tone="red">{error}</Alert>}
              {success && <Alert tone="green">{success}</Alert>}

              <button type="submit" disabled={submitting} className={s.primary}>
                {submitting ? "Submitting..." : "Submit report"}
              </button>
            </form>
          </section>

          <section className={`${s.panel} overflow-hidden`}>
            <header className={`border-b px-5 py-3 ${s.divider}`}>
              <h2 className={s.title}>My submitted reports</h2>
            </header>
            {loading ? (
              <p className={`p-8 text-center text-sm ${s.muted}`}>Loading...</p>
            ) : reports.length === 0 ? (
              <p className={`p-8 text-center text-sm ${s.muted}`}>No reports submitted yet.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {reports.map((report) => (
                  <li key={report.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${s.strong}`}>{report.description}</p>
                        <p className={`mt-1 text-xs ${s.muted}`}>Work date: {fmt(report.workDate)}</p>
                        {report.status === "REJECTED" && report.reviewNotes && (
                          <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                            <p className="text-xs text-red-300">Rejection reason: {report.reviewNotes}</p>
                          </div>
                        )}
                        {report.status === "APPROVED" && showOd && (
                          <p className={`mt-1 text-xs ${s.muted}`}>You can request OD for this report in the OD tab.</p>
                        )}
                      </div>
                      {reportChip(report.status)}
                    </div>
                    <p className={`mt-2 text-[11px] ${s.faint}`}>Submitted {fmt(report.submittedAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* ── OD (Core and Normal Members only) ── */}
      {showOd && activeTab === "od" && (
        <>
          {canRequestOD ? (
            <section className={`${s.panel} p-5 sm:p-6`}>
              <h2 className={s.title}>Request OD</h2>
              <p className={`mt-1 text-xs ${s.muted}`}>Select an approved report and describe the activity you need OD for.</p>

              <form onSubmit={handleRequestOD} className="mt-4 space-y-4">
                <div>
                  <label className={s.label}>Approved report</label>
                  <select
                    value={odForm.reportId}
                    onChange={(e) => setODForm({ ...odForm, reportId: e.target.value })}
                    required
                    className={s.input}
                  >
                    <option value="">Select a report...</option>
                    {eligibleReports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {fmt(r.workDate)} - {r.description.slice(0, 60)}
                        {r.description.length > 60 ? "..." : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={s.label}>
                    Event <span className="text-red-400">(required)</span>
                  </label>
                  {events.length === 0 ? (
                    <div className={`${s.box} px-4 py-3`}>
                      <p className={`text-sm ${s.muted}`}>No events available. Ask the Super Admin to add events.</p>
                    </div>
                  ) : (
                    <select
                      value={odForm.eventId}
                      onChange={(e) => setODForm({ ...odForm, eventId: e.target.value })}
                      required
                      className={s.input}
                    >
                      <option value="">Select an event...</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} - {fmt(ev.eventDate)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className={s.label}>
                    Time slots needed{" "}
                    {odForm.slots.length > 0 && (
                      <span
                        className={
                          odForm.slots.length >= 2 && odForm.slots.length % 2 === 0 ? "text-emerald-400" : "text-amber-400"
                        }
                      >
                        ({odForm.slots.length} selected
                        {odForm.slots.length < 2
                          ? ", minimum 2"
                          : odForm.slots.length % 2 !== 0
                          ? ", must be an even number"
                          : ""}
                        )
                      </span>
                    )}
                  </label>
                  <div className={`${s.box} max-h-52 space-y-1.5 overflow-y-auto p-2`}>
                    {SLOT_TIMES.map((slot) => {
                      const checked = odForm.slots.includes(slot.time);
                      return (
                        <label
                          key={slot.label}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            checked ? s.slotOn : s.slotOff
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setODForm((prev) => ({
                                ...prev,
                                slots: checked ? prev.slots.filter((x) => x !== slot.time) : [...prev.slots, slot.time],
                              }))
                            }
                            className={`h-4 w-4 shrink-0 ${s.check}`}
                          />
                          <span className="w-10 text-xs font-semibold text-white">{slot.label}</span>
                          <span className={`text-xs ${s.muted}`}>{slot.time}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className={`mt-1.5 text-xs ${s.faint}`}>Select an even number of slots (2, 4, 6...)</p>
                </div>

                <div>
                  <label className={s.label}>OD reason</label>
                  <textarea
                    value={odForm.reason}
                    onChange={(e) => setODForm({ ...odForm, reason: e.target.value })}
                    required
                    rows={2}
                    placeholder="e.g. Represented the club at an inter-college dance competition"
                    className={`${s.input} resize-none`}
                  />
                </div>

                {odError && <Alert tone="red">{odError}</Alert>}
                {odSuccess && <Alert tone="green">{odSuccess}</Alert>}

                <button type="submit" disabled={odSubmitting} className={s.primary}>
                  {odSubmitting ? "Submitting..." : "Request OD"}
                </button>
              </form>
            </section>
          ) : (
            <section className={`${s.panel} p-8 text-center`}>
              <FileBadge size={28} className={`mx-auto mb-3 ${s.faint}`} />
              <p className={`mb-1 text-sm font-medium ${s.strong}`}>No eligible reports for OD</p>
              <p className={`text-xs ${s.muted}`}>
                You need at least one approved report without an OD request. Submit a report, wait for approval, then
                come back here.
              </p>
            </section>
          )}

          <section className={`${s.panel} overflow-hidden`}>
            <header className={`border-b px-5 py-3 ${s.divider}`}>
              <h2 className={s.title}>My OD requests</h2>
            </header>
            {loading ? (
              <p className={`p-8 text-center text-sm ${s.muted}`}>Loading...</p>
            ) : odRequests.length === 0 ? (
              <p className={`p-8 text-center text-sm ${s.muted}`}>No OD requests yet.</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {odRequests.map((od) => (
                  <li key={od.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${s.strong}`}>{od.reason}</p>
                        <p className={`mt-1 text-xs ${s.muted}`}>Activity: {fmt(od.activityDate)}</p>
                        <p className={`mt-0.5 text-xs ${s.faint}`}>
                          Report: {od.report.description.slice(0, 60)}
                          {od.report.description.length > 60 ? "..." : ""}
                        </p>
                        {od.event && <p className={`mt-0.5 text-xs ${s.accent}`}>Event: {od.event.name}</p>}
                        {od.slots && od.slots.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {od.slots.map((slot) => (
                              <span key={slot} className={s.chip}>
                                {slot}
                              </span>
                            ))}
                          </div>
                        )}
                        {od.status === "APPROVED" && od.approvedAt && (
                          <p className="mt-1 text-xs text-emerald-400">OD approved on {fmt(od.approvedAt)}</p>
                        )}
                      </div>
                      {od.status === "APPROVED" ? (
                        <StatusChip tone="green" icon={<CheckCircle size={12} />}>OD approved</StatusChip>
                      ) : (
                        <StatusChip tone="violet" icon={<Clock size={12} />}>OD pending</StatusChip>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

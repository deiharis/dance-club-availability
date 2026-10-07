"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Trash2, MapPin, Clock, X, ClipboardCheck, CalendarClock } from "lucide-react";
import { useToast, useConfirm } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/states";
import { DateTile, WhenBadge, CancelledNote, stageCard, stageInput, stageButton, ghostButton } from "@/components/dance/schedule";

type Rehearsal = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  venue: string | null;
  cancelledAt: string | null; // YYYY-MM-DD, null = going ahead
  cancelledBy: string | null;
  marked: number; // attendance records saved
};

const emptyForm = { title: "", date: "", startTime: "", endTime: "", venue: "" };

export default function RehearsalsClient({
  team,
  upcoming,
  past,
  today,
  canManage,
}: {
  team: string;
  upcoming: Rehearsal[];
  past: Rehearsal[];
  today: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const timeError = form.startTime && form.endTime && form.endTime <= form.startTime ? "End time must be after the start time." : "";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (timeError) return;
    setBusy(true);
    const res = await fetch("/api/dance/rehearsals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, team }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      toast.error("Rehearsal not created", res ? (await res.json().catch(() => ({}))).error : "Check your connection and try again.");
      return;
    }
    toast.success("Rehearsal created", `Everyone in ${team} has been notified.`);
    setForm(emptyForm);
    setShowForm(false);
    router.refresh();
  }

  // Upcoming and going ahead: cancel (kept in the history, team notified by the server).
  // Past or already cancelled: delete for good.
  async function remove(r: Rehearsal) {
    const cancelling = !r.cancelledAt && r.date >= today;
    const ok = await confirm(
      cancelling
        ? {
            title: `Cancel "${r.title}"?`,
            body: `It is on ${r.date}, ${r.startTime} - ${r.endTime}. Everyone in the team will be notified. It stays in the list marked as cancelled.`,
            confirmLabel: "Cancel rehearsal",
            cancelLabel: "Keep it",
            tone: "danger",
          }
        : {
            title: `Delete "${r.title}"?`,
            body: r.cancelledAt
              ? "This removes the cancelled rehearsal from the history. Nobody is notified."
              : "This past rehearsal and its attendance records are removed. This cannot be undone.",
            confirmLabel: "Delete",
            tone: "danger",
          }
    );
    if (!ok) return;
    const res = await fetch(`/api/dance/rehearsals/${r.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      const msg = res ? (await res.json().catch(() => ({}))).error : "Check your connection and try again.";
      toast.error(cancelling ? "Could not cancel the rehearsal" : "Could not delete", msg);
    } else {
      toast.success(cancelling ? "Rehearsal cancelled" : "Rehearsal deleted", cancelling ? "The team has been notified." : r.title);
    }
    router.refresh();
  }

  const row = (r: Rehearsal) => {
    const cancelled = !!r.cancelledAt;
    const started = r.date <= today;
    return (
      <li key={r.id} className={`${stageCard} flex gap-4 px-4 py-3`}>
        <DateTile date={r.date} muted={cancelled || r.date < today} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`font-medium ${cancelled ? "text-orange-100/50 line-through decoration-red-400/60" : "text-white"}`}>{r.title}</p>
            {cancelled ? (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">Cancelled</span>
            ) : (
              <WhenBadge date={r.date} today={today} />
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-orange-100/60">
            <span className="flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {r.startTime} - {r.endTime}
            </span>
            {r.venue && (
              <span className="flex items-center gap-1">
                <MapPin size={12} aria-hidden="true" />
                {r.venue}
              </span>
            )}
          </p>
          {cancelled && <CancelledNote by={r.cancelledBy} at={r.cancelledAt!} />}
          {canManage && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!cancelled && started && (
                <Link href={`/dance/attendance/${r.id}`} className={ghostButton}>
                  <ClipboardCheck size={13} aria-hidden="true" />
                  {r.marked > 0 ? `Attendance (${r.marked} marked)` : "Mark attendance"}
                </Link>
              )}
              <button onClick={() => remove(r)} className={`${ghostButton} hover:!border-red-400/40 hover:!text-red-300`}>
                {!cancelled && r.date >= today ? (
                  <>
                    <X size={13} aria-hidden="true" /> Cancel
                  </>
                ) : (
                  <>
                    <Trash2 size={13} aria-hidden="true" /> Delete
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      {canManage && (
        <button onClick={() => setShowForm(!showForm)} aria-expanded={showForm} className={`${stageButton} flex items-center gap-2 px-4 py-2`}>
          <CalendarPlus size={16} aria-hidden="true" />
          New rehearsal
        </button>
      )}

      {canManage && showForm && (
        <form onSubmit={add} className={`${stageCard} page-enter mt-4 grid gap-3 p-4 sm:grid-cols-3`}>
          <label className="sm:col-span-3">
            <span className="mb-1 block text-xs text-orange-100/60">Title</span>
            <input required placeholder="e.g. Choreo practice" className={stageInput} value={form.title} onChange={set("title")} />
          </label>
          <label>
            <span className="mb-1 block text-xs text-orange-100/60">Date</span>
            <input required type="date" className={stageInput} value={form.date} onChange={set("date")} />
          </label>
          <label>
            <span className="mb-1 block text-xs text-orange-100/60">Starts</span>
            <input required type="time" className={stageInput} value={form.startTime} onChange={set("startTime")} />
          </label>
          <label>
            <span className="mb-1 block text-xs text-orange-100/60">Ends</span>
            <input required type="time" className={stageInput} value={form.endTime} onChange={set("endTime")} aria-invalid={!!timeError} />
          </label>
          {timeError && <p className="text-xs text-red-300 sm:col-span-3">{timeError}</p>}
          <label className="sm:col-span-3">
            <span className="mb-1 block text-xs text-orange-100/60">Venue (optional)</span>
            <input placeholder="e.g. AB1 dance room" className={stageInput} value={form.venue} onChange={set("venue")} />
          </label>
          <button disabled={busy || !!timeError} className={`${stageButton} py-2 sm:col-span-3`}>
            {busy ? "Saving..." : `Create for ${team} and notify the team`}
          </button>
        </form>
      )}

      <h2 className="mb-3 mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-orange-100/50">Upcoming</h2>
      {upcoming.length === 0 ? (
        <EmptyState
          stage
          compact
          icon={CalendarClock}
          title="No rehearsals planned"
          body={canManage ? "Plan the next one and the whole team is told straight away." : "Your Team Leader has not planned the next rehearsal yet."}
          action={canManage && !showForm ? { label: "New rehearsal", onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <ul className="space-y-3">{upcoming.map(row)}</ul>
      )}

      <h2 className="mb-3 mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-orange-100/50">Past</h2>
      {past.length === 0 ? <p className="text-sm text-orange-100/50">No past rehearsals yet.</p> : <ul className="space-y-3">{past.map(row)}</ul>}
    </div>
  );
}

"use client";

import { useToast, useConfirm } from "@/components/ui/feedback";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Trash2, FileBadge } from "lucide-react";
import { Skeleton, EmptyState } from "@/components/ui/states";
import { panel, control, controlLabel, sectionTitle, dateIN } from "@/components/console/ui";

interface Event {
  id: string;
  name: string;
  eventDate: string;
  createdAt: string;
  _count?: { odRequests: number };
}

export default function EventsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", eventDate: "" });

  function loadEvents() {
    setLoading(true);
    fetch("/api/events", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Could not load events", "Check your connection and refresh the page."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to add event");
      return;
    }

    toast.success("Event added", `Members can now pick "${form.name.trim()}" when requesting OD.`);
    setForm({ name: "", eventDate: "" });
    loadEvents();
  }

  async function handleDelete(id: string, name: string, ods: number) {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      body:
        (ods > 0
          ? `${ods} OD request${ods === 1 ? " is" : "s are"} linked to it. They are kept, but will show "event not set". `
          : "") + "Members will no longer be able to choose this event for OD requests. This cannot be undone.",
      confirmLabel: "Delete event",
      tone: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not delete the event", (await res.json().catch(() => ({}))).error);
    toast.success("Event deleted", name);
    loadEvents();
  }

  // Dates are stored as UTC midnight of the Indian calendar day; compare with today's Indian date.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const upcoming = events.filter((e) => e.eventDate.slice(0, 10) >= today).reverse();
  const past = events.filter((e) => e.eventDate.slice(0, 10) < today);

  const row = (event: Event) => {
    const d = new Date(event.eventDate);
    return (
      <li key={event.id} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.03]">
        <div className="w-12 shrink-0 rounded-md border border-white/15 bg-black/30 py-1.5 text-center leading-tight">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">
            {d.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
          </p>
          <p className="text-base font-bold tabular-nums text-white">
            {d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "UTC" })}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{event.name}</p>
          <p className="text-xs text-zinc-500">{dateIN(event.eventDate, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</p>
        </div>
        {(event._count?.odRequests ?? 0) > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded bg-violet-500/15 px-2 py-1 text-[11px] font-medium text-violet-200" title="OD requests for this event">
            <FileBadge size={12} aria-hidden="true" />
            {event._count!.odRequests} OD
          </span>
        )}
        <button
          onClick={() => handleDelete(event.id, event.name, event._count?.odRequests ?? 0)}
          aria-label={`Delete ${event.name}`}
          className="rounded p-2 text-zinc-600 transition-colors hover:bg-white/5 hover:text-red-400"
          title="Delete event"
        >
          <Trash2 size={15} />
        </button>
      </li>
    );
  };

  return (
    <div>
      <div data-section="Super admin" className="c-page-header">
        <h1 className="text-white">Events</h1>
        <p className="text-zinc-500 mt-0.5">Events that members choose from when requesting OD</p>
      </div>

      <div className="p-4 sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 max-w-5xl">
        {/* List */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading events">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No events yet" body="Add one with the form so members can pick it when they request OD." />
          ) : (
            <>
              <section className={panel}>
                <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <h2 className={sectionTitle}>Upcoming</h2>
                  <span className="text-xs tabular-nums text-zinc-500">{upcoming.length}</span>
                </header>
                {upcoming.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-zinc-500">No upcoming events.</p>
                ) : (
                  <ul className="divide-y divide-white/5">{upcoming.map(row)}</ul>
                )}
              </section>

              {past.length > 0 && (
                <section className={panel}>
                  <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <h2 className={sectionTitle}>Past</h2>
                    <span className="text-xs tabular-nums text-zinc-500">{past.length}</span>
                  </header>
                  <ul className="divide-y divide-white/5 opacity-70">{past.map(row)}</ul>
                </section>
              )}
            </>
          )}
        </div>

        {/* Add event, always visible */}
        <aside className="mt-6 lg:sticky lg:top-24 lg:mt-0">
          <form onSubmit={handleAdd} className={`${panel} space-y-4 p-5`}>
            <h2 className={sectionTitle}>New event</h2>
            <div>
              <label className={controlLabel}>Event name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Inter-College Dance Competition"
                className={control}
              />
            </div>
            <div>
              <label className={controlLabel}>Event date</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                required
                className={`${control} [color-scheme:dark]`}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(124,58,237,0.9)] transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              <Plus size={14} />
              {submitting ? "Adding..." : "Add event"}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

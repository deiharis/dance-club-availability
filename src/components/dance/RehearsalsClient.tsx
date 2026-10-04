"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Trash2, MapPin, Clock } from "lucide-react";

type Rehearsal = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  venue: string | null;
};

const emptyForm = { title: "", date: "", startTime: "", endTime: "", venue: "" };

const input =
  "w-full bg-[#0b0614] border border-fuchsia-950 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-fuchsia-500 [color-scheme:dark]";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC", // date is stored as UTC midnight; avoid a day shift
  });

function List({
  title,
  items,
  canManage,
  onDelete,
}: {
  title: string;
  items: Rehearsal[];
  canManage: boolean;
  onDelete: (r: Rehearsal) => void;
}) {
  return (
    <div className="mt-6">
      <h2 className="text-sm font-medium text-purple-200/70 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-purple-300/50 text-sm">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div
              key={r.id}
              className="bg-[#140a1f] border border-fuchsia-950 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
            >
              <div>
                <p className="text-white font-medium">{r.title}</p>
                <p className="text-fuchsia-200/80 text-sm mt-0.5">
                  {fmtDate(r.date)}
                </p>
                <p className="text-purple-300/60 text-xs mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {r.startTime} - {r.endTime}
                  </span>
                  {r.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {r.venue}
                    </span>
                  )}
                </p>
              </div>
              {canManage && (
                <button
                  onClick={() => onDelete(r)}
                  title="Delete rehearsal"
                  className="text-purple-300/50 hover:text-red-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RehearsalsClient({
  team,
  upcoming,
  past,
  canManage,
}: {
  team: string;
  upcoming: Rehearsal[];
  past: Rehearsal[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof emptyForm) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/dance/rehearsals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, team }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create rehearsal");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    router.refresh();
  }

  async function remove(r: Rehearsal) {
    if (!confirm(`Delete "${r.title}"? Its attendance records are deleted too.`)) return;
    setError("");
    const res = await fetch(`/api/dance/rehearsals/${r.id}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json()).error ?? "Could not delete");
    router.refresh();
  }

  return (
    <div>
      {canManage && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <CalendarPlus size={16} />
          New rehearsal
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {canManage && showForm && (
        <form
          onSubmit={add}
          className="mt-4 grid sm:grid-cols-3 gap-3 bg-[#140a1f] border border-fuchsia-950 rounded-xl p-4"
        >
          <input required placeholder="Title (e.g. Choreo practice)" className={`${input} sm:col-span-3`} value={form.title} onChange={set("title")} />
          <input required type="date" className={input} value={form.date} onChange={set("date")} />
          <input required type="time" className={input} value={form.startTime} onChange={set("startTime")} />
          <input required type="time" className={input} value={form.endTime} onChange={set("endTime")} />
          <input placeholder="Venue (optional)" className={`${input} sm:col-span-3`} value={form.venue} onChange={set("venue")} />
          <button
            disabled={busy}
            className="sm:col-span-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
          >
            {busy ? "Saving..." : `Create for ${team}`}
          </button>
        </form>
      )}

      <List title="Upcoming" items={upcoming} canManage={canManage} onDelete={remove} />
      <List title="Past" items={past} canManage={canManage} onDelete={remove} />
    </div>
  );
}

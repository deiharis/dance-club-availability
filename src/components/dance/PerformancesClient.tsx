"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MapPin, Pencil } from "lucide-react";

type Dancer = { id: string; fullName: string; skillLevel: "PROFESSIONAL" | "AMATEUR" };
type Performance = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  venue: string | null;
  dancerIds: string[];
};

const input =
  "w-full bg-black/30 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white placeholder-orange-100/30 focus:outline-none focus:border-orange-400/70 [color-scheme:dark]";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function DancerPicker({
  dancers,
  selected,
  onChange,
}: {
  dancers: Dancer[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={() => onChange(dancers.map((d) => d.id))}
          className="text-xs text-orange-300 hover:text-orange-200"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-orange-100/60 hover:text-white"
        >
          Clear
        </button>
        <span className="text-xs text-orange-100/50">{selected.length} selected</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
        {dancers.map((d) => (
          <label
            key={d.id}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 text-sm text-white cursor-pointer hover:border-orange-500/40"
          >
            <input
              type="checkbox"
              checked={selected.includes(d.id)}
              onChange={() => toggle(d.id)}
              className="accent-orange-500"
            />
            <span className="flex-1 truncate">{d.fullName}</span>
            <span className="text-[10px] text-orange-100/50">
              {d.skillLevel === "PROFESSIONAL" ? "Pro" : "Amateur"}
            </span>
          </label>
        ))}
        {dancers.length === 0 && (
          <p className="text-sm text-orange-100/50">No dancers in this team yet.</p>
        )}
      </div>
    </div>
  );
}

function Item({
  p,
  dancers,
  canManage,
  myId,
  onError,
}: {
  p: Performance;
  dancers: Dancer[];
  canManage: boolean;
  myId: string;
  onError: (m: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [ids, setIds] = useState(p.dancerIds);
  const [busy, setBusy] = useState(false);
  const names = dancers.filter((d) => p.dancerIds.includes(d.id)).map((d) => d.fullName);

  async function save() {
    setBusy(true);
    onError("");
    const res = await fetch(`/api/dance/performances/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dancerIds: ids }),
    });
    setBusy(false);
    if (!res.ok) return onError((await res.json()).error ?? "Could not save");
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete "${p.name}"?`)) return;
    onError("");
    const res = await fetch(`/api/dance/performances/${p.id}`, { method: "DELETE" });
    if (!res.ok) return onError((await res.json()).error ?? "Could not delete");
    router.refresh();
  }

  return (
    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-white/10 rounded-3xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-medium">
            {p.name}
            {p.dancerIds.includes(myId) && (
              <span className="ml-2 text-[10px] font-medium text-orange-200 bg-orange-500/15 px-2 py-0.5 rounded">
                You are in this
              </span>
            )}
          </p>
          <p className="text-orange-200/80 text-sm mt-0.5">{fmtDate(p.date)}</p>
          {p.venue && (
            <p className="text-orange-100/60 text-xs mt-1 flex items-center gap-1">
              <MapPin size={12} />
              {p.venue}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(!editing)}
              title="Edit dancers"
              className="text-orange-100/50 hover:text-orange-300 p-1"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={remove}
              title="Delete performance"
              className="text-orange-100/50 hover:text-red-400 p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <DancerPicker dancers={dancers} selected={ids} onChange={setIds} />
          <button
            onClick={save}
            disabled={busy}
            className="mt-3 bg-orange-500 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            {busy ? "Saving..." : "Save dancers"}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-orange-100/70">
          <span className="text-orange-100/50">
            {names.length} dancer{names.length === 1 ? "" : "s"}:{" "}
          </span>
          {names.length ? names.join(", ") : "none selected yet"}
        </p>
      )}
    </div>
  );
}

export default function PerformancesClient({
  team,
  dancers,
  upcoming,
  past,
  canManage,
  myId,
}: {
  team: string;
  dancers: Dancer[];
  upcoming: Performance[];
  past: Performance[];
  canManage: boolean;
  myId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", eventDate: "", venue: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/dance/performances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, team, dancerIds: picked }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create performance");
      return;
    }
    setForm({ name: "", eventDate: "", venue: "" });
    setPicked([]);
    setShowForm(false);
    router.refresh();
  }

  const section = (title: string, items: Performance[]) => (
    <div className="mt-6">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-orange-100/50 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-orange-100/50 text-sm">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Item key={p.id} p={p} dancers={dancers} canManage={canManage} myId={myId} onError={setError} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {canManage && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 text-white text-sm font-medium px-3 py-2 rounded-full transition-colors"
        >
          <Plus size={16} />
          New performance
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-3 py-2">
          {error}
        </p>
      )}

      {canManage && showForm && (
        <form
          onSubmit={add}
          className="mt-4 space-y-3 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-white/10 rounded-3xl p-4"
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <input required placeholder="Performance name" className={`${input} sm:col-span-2`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="date" className={input} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            <input placeholder="Venue (optional)" className={`${input} sm:col-span-3`} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </div>
          <DancerPicker dancers={dancers} selected={picked} onChange={setPicked} />
          <button
            disabled={busy}
            className="bg-orange-500 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            {busy ? "Saving..." : `Create for ${team}`}
          </button>
        </form>
      )}

      {section("Upcoming", upcoming)}
      {section("Past", past)}
    </div>
  );
}

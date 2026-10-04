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
  "w-full bg-[#0b0614] border border-fuchsia-950 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-fuchsia-500 [color-scheme:dark]";

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
          className="text-xs text-fuchsia-300 hover:text-fuchsia-200"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-xs text-purple-300/60 hover:text-white"
        >
          Clear
        </button>
        <span className="text-xs text-purple-300/50">{selected.length} selected</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto">
        {dancers.map((d) => (
          <label
            key={d.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-fuchsia-950 text-sm text-white cursor-pointer hover:border-fuchsia-500/40"
          >
            <input
              type="checkbox"
              checked={selected.includes(d.id)}
              onChange={() => toggle(d.id)}
              className="accent-fuchsia-500"
            />
            <span className="flex-1 truncate">{d.fullName}</span>
            <span className="text-[10px] text-purple-300/50">
              {d.skillLevel === "PROFESSIONAL" ? "Pro" : "Amateur"}
            </span>
          </label>
        ))}
        {dancers.length === 0 && (
          <p className="text-sm text-purple-300/50">No dancers in this team yet.</p>
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
    <div className="bg-[#140a1f] border border-fuchsia-950 rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-medium">
            {p.name}
            {p.dancerIds.includes(myId) && (
              <span className="ml-2 text-[10px] font-medium text-fuchsia-200 bg-fuchsia-500/15 px-2 py-0.5 rounded">
                You are in this
              </span>
            )}
          </p>
          <p className="text-fuchsia-200/80 text-sm mt-0.5">{fmtDate(p.date)}</p>
          {p.venue && (
            <p className="text-purple-300/60 text-xs mt-1 flex items-center gap-1">
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
              className="text-purple-300/50 hover:text-fuchsia-300 p-1"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={remove}
              title="Delete performance"
              className="text-purple-300/50 hover:text-red-400 p-1"
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
            className="mt-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            {busy ? "Saving..." : "Save dancers"}
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-purple-100/70">
          <span className="text-purple-300/50">
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
      <h2 className="text-sm font-medium text-purple-200/70 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-purple-300/50 text-sm">Nothing here.</p>
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
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New performance
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
          className="mt-4 space-y-3 bg-[#140a1f] border border-fuchsia-950 rounded-xl p-4"
        >
          <div className="grid sm:grid-cols-3 gap-3">
            <input required placeholder="Performance name" className={`${input} sm:col-span-2`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="date" className={input} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            <input placeholder="Venue (optional)" className={`${input} sm:col-span-3`} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </div>
          <DancerPicker dancers={dancers} selected={picked} onChange={setPicked} />
          <button
            disabled={busy}
            className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
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

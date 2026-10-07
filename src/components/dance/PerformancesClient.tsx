"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, MapPin, Users, X, Sparkles } from "lucide-react";
import { useToast, useConfirm } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/states";
import { DateTile, WhenBadge, CancelledNote, stageCard, stageInput, stageButton, ghostButton } from "@/components/dance/schedule";

type Dancer = { id: string; fullName: string; skillLevel: "PROFESSIONAL" | "AMATEUR" };
type Performance = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  venue: string | null;
  dancerIds: string[];
  cancelledAt: string | null; // YYYY-MM-DD, null = going ahead
  cancelledBy: string | null;
};

function DancerPicker({ dancers, selected, onChange }: { dancers: Dancer[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  if (dancers.length === 0) return <p className="text-sm text-orange-100/50">No dancers in this team yet.</p>;
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button type="button" onClick={() => onChange(dancers.map((d) => d.id))} className="text-xs text-orange-300 hover:text-orange-200">
          Select all
        </button>
        <button type="button" onClick={() => onChange([])} className="text-xs text-orange-100/60 hover:text-white">
          Clear
        </button>
        <span className="text-xs text-orange-100/50">
          {selected.length} of {dancers.length} selected
        </span>
      </div>
      <div className="grid max-h-60 gap-1.5 overflow-y-auto sm:grid-cols-2">
        {dancers.map((d) => {
          const on = selected.includes(d.id);
          return (
            <label
              key={d.id}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm text-white transition-colors duration-120 ${
                on ? "border-orange-400/50 bg-orange-500/10" : "border-white/10 hover:border-orange-500/40"
              }`}
            >
              <input type="checkbox" checked={on} onChange={() => toggle(d.id)} className="accent-orange-500" />
              <span className="flex-1 truncate">{d.fullName}</span>
              <span className="text-[10px] text-orange-100/50">{d.skillLevel === "PROFESSIONAL" ? "Pro" : "Amateur"}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Item({ p, dancers, canManage, myId, today }: { p: Performance; dancers: Dancer[]; canManage: boolean; myId: string; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [ids, setIds] = useState(p.dancerIds);
  const [busy, setBusy] = useState(false);
  const names = dancers.filter((d) => p.dancerIds.includes(d.id)).map((d) => d.fullName);
  const cancelled = !!p.cancelledAt;
  const cancelling = !cancelled && p.date >= today;
  const mine = p.dancerIds.includes(myId);

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/dance/performances/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dancerIds: ids }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      toast.error("Dancers not saved", res ? (await res.json().catch(() => ({}))).error : "Check your connection and try again.");
      return;
    }
    const added = ids.filter((id) => !p.dancerIds.includes(id)).length;
    toast.success("Dancers saved", added > 0 ? `${added} newly added dancer${added === 1 ? " has" : "s have"} been notified.` : `${ids.length} dancing in ${p.name}.`);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    const ok = await confirm(
      cancelling
        ? {
            title: `Cancel "${p.name}"?`,
            body: `It is on ${p.date}. Everyone in the team will be notified. It stays in the list marked as cancelled.`,
            confirmLabel: "Cancel performance",
            cancelLabel: "Keep it",
            tone: "danger",
          }
        : {
            title: `Delete "${p.name}"?`,
            body: cancelled ? "This removes the cancelled performance from the history. Nobody is notified." : "This past performance is removed from the list.",
            confirmLabel: "Delete",
            tone: "danger",
          }
    );
    if (!ok) return;
    const res = await fetch(`/api/dance/performances/${p.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      const msg = res ? (await res.json().catch(() => ({}))).error : "Check your connection and try again.";
      toast.error(cancelling ? "Could not cancel the performance" : "Could not delete", msg);
      return;
    }
    toast.success(cancelling ? "Performance cancelled" : "Performance deleted", cancelling ? "The team has been notified." : p.name);
    router.refresh();
  }

  return (
    <li className={`${stageCard} flex gap-4 px-4 py-3`}>
      <DateTile date={p.date} muted={cancelled || p.date < today} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-medium ${cancelled ? "text-orange-100/50 line-through decoration-red-400/60" : "text-white"}`}>{p.name}</p>
          {cancelled ? (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">Cancelled</span>
          ) : (
            <WhenBadge date={p.date} today={today} />
          )}
          {mine && !cancelled && (
            <span className="flex items-center gap-1 rounded-full bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              <Sparkles size={10} aria-hidden="true" /> You are dancing
            </span>
          )}
        </div>
        {p.venue && (
          <p className="mt-1 flex items-center gap-1 text-xs text-orange-100/60">
            <MapPin size={12} aria-hidden="true" />
            {p.venue}
          </p>
        )}
        {cancelled && <CancelledNote by={p.cancelledBy} at={p.cancelledAt!} />}

        {editing ? (
          <div className="mt-3">
            <DancerPicker dancers={dancers} selected={ids} onChange={setIds} />
            <div className="mt-3 flex gap-2">
              <button onClick={save} disabled={busy} className={`${stageButton} px-4 py-2`}>
                {busy ? "Saving..." : "Save dancers"}
              </button>
              <button
                onClick={() => {
                  setIds(p.dancerIds);
                  setEditing(false);
                }}
                className={ghostButton}
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-orange-100/70">
            <span className="text-orange-100/50">
              {names.length} dancer{names.length === 1 ? "" : "s"}
              {names.length ? ": " : ""}
            </span>
            {names.length ? names.join(", ") : canManage && !cancelled ? "nobody picked yet" : ""}
          </p>
        )}

        {canManage && !editing && (
          <div className="mt-3 flex flex-wrap gap-2">
            {!cancelled && (
              <button onClick={() => setEditing(true)} className={ghostButton}>
                <Users size={13} aria-hidden="true" /> Choose dancers
              </button>
            )}
            <button onClick={remove} className={`${ghostButton} hover:!border-red-400/40 hover:!text-red-300`}>
              {cancelling ? (
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
}

export default function PerformancesClient({
  team,
  dancers,
  upcoming,
  past,
  today,
  canManage,
  myId,
}: {
  team: string;
  dancers: Dancer[];
  upcoming: Performance[];
  past: Performance[];
  today: string;
  canManage: boolean;
  myId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", eventDate: "", venue: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/dance/performances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, team, dancerIds: picked }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      toast.error("Performance not created", res ? (await res.json().catch(() => ({}))).error : "Check your connection and try again.");
      return;
    }
    toast.success("Performance created", `Everyone in ${team} has been notified.`);
    setForm({ name: "", eventDate: "", venue: "" });
    setPicked([]);
    setShowForm(false);
    router.refresh();
  }

  const list = (items: Performance[]) => (
    <ul className="space-y-3">
      {items.map((p) => (
        <Item key={p.id} p={p} dancers={dancers} canManage={canManage} myId={myId} today={today} />
      ))}
    </ul>
  );

  return (
    <div>
      {canManage && (
        <button onClick={() => setShowForm(!showForm)} aria-expanded={showForm} className={`${stageButton} flex items-center gap-2 px-4 py-2`}>
          <Plus size={16} aria-hidden="true" />
          New performance
        </button>
      )}

      {canManage && showForm && (
        <form onSubmit={add} className={`${stageCard} page-enter mt-4 space-y-3 p-4`}>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs text-orange-100/60">Name</span>
              <input required placeholder="e.g. Riviera opening act" className={stageInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label>
              <span className="mb-1 block text-xs text-orange-100/60">Date</span>
              <input required type="date" className={stageInput} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
            </label>
            <label className="sm:col-span-3">
              <span className="mb-1 block text-xs text-orange-100/60">Venue (optional)</span>
              <input placeholder="e.g. Main auditorium" className={stageInput} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </label>
          </div>
          <DancerPicker dancers={dancers} selected={picked} onChange={setPicked} />
          <button disabled={busy} className={`${stageButton} px-4 py-2`}>
            {busy ? "Saving..." : `Create for ${team} and notify the team`}
          </button>
        </form>
      )}

      <h2 className="mb-3 mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-orange-100/50">Upcoming</h2>
      {upcoming.length === 0 ? (
        <EmptyState
          stage
          compact
          icon={Sparkles}
          title="No performances coming up"
          body={canManage ? "Add the next show and pick who is dancing; the team is told straight away." : "When your team is booked for a show it will appear here."}
          action={canManage && !showForm ? { label: "New performance", onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        list(upcoming)
      )}

      <h2 className="mb-3 mt-8 text-[11px] font-medium uppercase tracking-[0.2em] text-orange-100/50">Past</h2>
      {past.length === 0 ? <p className="text-sm text-orange-100/50">No past performances yet.</p> : list(past)}
    </div>
  );
}

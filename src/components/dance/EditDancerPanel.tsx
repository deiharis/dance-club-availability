"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DANCER_ROLES } from "@/lib/teams";
import ProgrammeSelect from "@/components/ui/ProgrammeSelect";

export type EditableDancer = {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  phone: string | null;
  department: string;
  academicYear: number;
  position: string | null;
  isFFCS: boolean;
};

const label = "mb-1 block text-[11px] font-medium text-orange-100/60";

// Dance Floor roster: a Team Leader (or the SuperAdmin) edits a dancer in their own team.
// Saves through PATCH /api/members/[id], which re-checks on the server that the caller manages
// this dancer's team and that the dancer stays a Dancer in that team.
export default function EditDancerPanel({
  dancer,
  team,
  isSelf,
  input,
  onClose,
  onSaved,
}: {
  dancer: EditableDancer;
  team: string;
  isSelf: boolean; // a Lead editing themselves cannot change their own role (would lock them out)
  input: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    fullName: dancer.fullName,
    registerNumber: dancer.registerNumber,
    email: dancer.email,
    phone: dancer.phone ?? "",
    department: dancer.department,
    academicYear: String(dancer.academicYear),
    position: dancer.position ?? "Normal Dancer",
    isFFCS: dancer.isFFCS,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/members/${dancer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, category: "DANCER", team }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not save");
    onSaved();
  }

  return (
    <form
      onSubmit={save}
      className="mt-4 rounded-3xl border border-orange-400/25 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-white">Edit {dancer.fullName}</p>
        <button type="button" onClick={onClose} title="Close" className="rounded-full p-1 text-orange-100/50 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ed-full-name" className={label}>Full name</label>
          <input id="ed-full-name" required className={input} value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} />
        </div>
        <div>
          <label htmlFor="ed-register-number" className={label}>Register number</label>
          <input id="ed-register-number" required className={input} value={f.registerNumber} onChange={(e) => set({ registerNumber: e.target.value })} />
        </div>
        <div>
          <label htmlFor="ed-email-also-their" className={label}>Email (also their login)</label>
          <input id="ed-email-also-their" required type="email" className={input} value={f.email} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div>
          <label htmlFor="ed-phone" className={label}>Phone</label>
          <input id="ed-phone" className={input} value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Programme / course</label>
          <ProgrammeSelect value={f.department} onChange={(department) => set({ department })} className={input} required={false} />
        </div>
        <div>
          <label htmlFor="ed-academic-year" className={label}>Academic year</label>
          <select id="ed-academic-year" className={input} value={f.academicYear} onChange={(e) => set({ academicYear: e.target.value })}>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ed-dancer-role" className={label}>Dancer role</label>
          <select id="ed-dancer-role"
            className={`${input} disabled:opacity-60`}
            value={f.position}
            disabled={isSelf}
            title={isSelf ? "You cannot change your own role" : undefined}
            onChange={(e) => set({ position: e.target.value })}
          >
            {DANCER_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-orange-50/80 sm:col-span-2">
          <input type="checkbox" checked={f.isFFCS} onChange={(e) => set({ isFFCS: e.target.checked })} className="h-4 w-4 accent-orange-500" />
          FFCS enrolled
        </label>
      </div>
      {error && <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} className="rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50">
          {busy ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onClose} className="rounded-full border border-white/10 px-5 py-2 text-sm text-orange-100/70 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}

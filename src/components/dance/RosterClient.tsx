"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus, UserMinus, Upload, Download, FileSpreadsheet, X } from "lucide-react";
import { DANCER_ROLES } from "@/lib/teams";

type Dancer = {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  position: string | null;
  category: string; // DANCER = pure dancer; anything else = member who also dances
  skillLevel: "PROFESSIONAL" | "AMATEUR";
  isFFCS: boolean;
};

const CATEGORY_BADGE: Record<string, string> = {
  CORE: "Core",
  MEMBER: "Member",
  FFCS_ONLY: "FFCS",
};

const emptyForm = {
  fullName: "",
  registerNumber: "",
  email: "",
  department: "",
  academicYear: "1",
  phone: "",
  password: "",
  position: "Normal Dancer",
  skillLevel: "AMATEUR",
  isFFCS: false,
};

const input =
  "w-full bg-black/30 border border-white/10 rounded-2xl px-3 py-2 text-sm text-white placeholder-orange-100/30 focus:outline-none focus:border-orange-400/70";

export default function RosterClient({
  team,
  dancers,
  selfId,
  canTransfer = false,
  canExport = false,
  readOnly = false,
}: {
  team: string;
  dancers: Dancer[];
  selfId: string | null;
  // SuperAdmin only: Excel import and the blank template for this team.
  canTransfer?: boolean;
  // SuperAdmin and Advisory: download this team as Excel.
  canExport?: boolean;
  // Advisory: sees the roster but cannot add, remove or change anyone (the APIs refuse too).
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof emptyForm) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  // Excel import into this team (SuperAdmin only; rows listed under another team are skipped).
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    attached?: number; // existing members (e.g. Core) put into the team
    skipped: number;
    errors: string[];
  } | null>(null);
  const q = `team=${encodeURIComponent(team)}`;

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);
    const body = new FormData();
    body.append("file", file);
    body.append("team", team);
    const res = await fetch("/api/dance/roster/import", { method: "POST", body });
    const data = await res.json();
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }
    setResult(data);
    router.refresh();
  }

  // Skill level and FFCS enrolment share one roster-settings endpoint.
  async function update(id: string, patch: { skillLevel?: string; isFFCS?: boolean }) {
    setError("");
    const res = await fetch(`/api/dance/members/${id}/skill`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) setError((await res.json()).error ?? "Could not update");
    router.refresh();
  }

  // Core / Normal / FFCS-only members only leave the team; their account stays.
  async function removeFromTeam(d: Dancer) {
    if (!confirm(`Take ${d.fullName} out of ${team}? Their account and committee role stay.`)) return;
    setError("");
    const res = await fetch(`/api/dance/members/${d.id}/team`, { method: "PATCH" });
    if (!res.ok) setError((await res.json()).error ?? "Could not remove from team");
    router.refresh();
  }

  async function remove(d: Dancer) {
    if (!confirm(`Remove ${d.fullName} and delete their account?`)) return;
    setError("");
    const res = await fetch(`/api/members/${d.id}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json()).error ?? "Could not remove");
    router.refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, category: "DANCER", team }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not add dancer");
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-orange-100/60 text-sm">
          {dancers.length} dancer{dancers.length === 1 ? "" : "s"} in {team}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canTransfer && (
          <>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importFile} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            title="Add dancers from an Excel file"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-orange-50/80 transition-colors hover:border-orange-400/40 hover:text-white disabled:opacity-50"
          >
            <Upload size={15} />
            {importing ? "Importing..." : "Import"}
          </button>
          <a
            href={`/api/dance/roster/export?${q}&template=1`}
            title="Download an empty Excel file with the right columns"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-orange-50/80 transition-colors hover:border-orange-400/40 hover:text-white"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">Template</span>
          </a>
          </>
          )}
          {(canTransfer || canExport) && (
            <a
              href={`/api/dance/roster/export?${q}`}
              title="Download this team's dancers and attendance as Excel"
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-orange-50/80 transition-colors hover:border-orange-400/40 hover:text-white"
            >
              <Download size={15} />
              Export
            </a>
          )}
          {readOnly ? (
            <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-orange-100/60">View only</span>
          ) : (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-orange-500 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 text-white text-sm font-medium px-3 py-2 rounded-full transition-colors"
            >
              <UserPlus size={16} />
              Add dancer
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-3xl border border-orange-400/25 bg-orange-500/[0.07] p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-white">
              Import finished: {result.created} new dancer{result.created === 1 ? "" : "s"}
              {result.attached ? `, ${result.attached} existing member${result.attached === 1 ? "" : "s"} added to the team` : ""}
              {result.skipped ? `, ${result.skipped} skipped` : ""}.
              {result.created > 0 && (
                <span className="font-normal text-orange-100/60"> Their temporary password is their register number.</span>
              )}
            </p>
            <button onClick={() => setResult(null)} title="Close" className="rounded-full p-1 text-orange-100/50 hover:text-white">
              <X size={15} />
            </button>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs text-orange-100/60">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl px-3 py-2">
          {error}
        </p>
      )}

      {showForm && !readOnly && (
        <form
          onSubmit={add}
          className="mt-4 grid sm:grid-cols-2 gap-3 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-white/10 rounded-3xl p-4"
        >
          <input required placeholder="Full name" className={input} value={form.fullName} onChange={set("fullName")} />
          <input required placeholder="Register number" className={input} value={form.registerNumber} onChange={set("registerNumber")} />
          <input required type="email" placeholder="Email" className={input} value={form.email} onChange={set("email")} />
          <input placeholder="Phone (optional)" className={input} value={form.phone} onChange={set("phone")} />
          <input required placeholder="Department" className={input} value={form.department} onChange={set("department")} />
          <select className={input} value={form.academicYear} onChange={set("academicYear")}>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <select className={input} value={form.position} onChange={set("position")}>
            {DANCER_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className={input} value={form.skillLevel} onChange={set("skillLevel")}>
            <option value="AMATEUR">Amateur</option>
            <option value="PROFESSIONAL">Professional</option>
          </select>
          <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-orange-50/80">
            <input
              type="checkbox"
              checked={form.isFFCS}
              onChange={(e) => setForm({ ...form, isFFCS: e.target.checked })}
              className="h-4 w-4 accent-orange-500"
            />
            FFCS enrolled
          </label>
          <input required type="password" minLength={6} placeholder="Temporary password" className={`${input} sm:col-span-2`} value={form.password} onChange={set("password")} />
          <button
            disabled={busy}
            className="sm:col-span-2 bg-orange-500 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-full"
          >
            {busy ? "Adding..." : `Add to ${team}`}
          </button>
        </form>
      )}

      <div className="mt-4 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-white/10 rounded-3xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-orange-100/50 text-xs border-b border-white/10">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Skill level</th>
              <th className="px-4 py-3 font-medium">FFCS</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {dancers.map((d) => (
              <tr key={d.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="flex flex-wrap items-center gap-2 text-white font-medium">
                    {d.fullName}
                    {d.category !== "DANCER" && (
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-200">
                        {CATEGORY_BADGE[d.category] ?? "Member"}
                      </span>
                    )}
                  </p>
                  <p className="text-orange-100/50 text-xs">{d.registerNumber} · {d.email}</p>
                </td>
                <td className="px-4 py-3 text-orange-100/80">
                  {/* Non-dancers are always Normal Dancers in their team; position is their committee role */}
                  {d.category === "DANCER" ? d.position ?? "Normal Dancer" : "Normal Dancer"}
                  {d.category !== "DANCER" && d.position && (
                    <p className="text-[11px] text-orange-100/40">{d.position}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {readOnly ? (
                    <span className="text-orange-100/80">{d.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur"}</span>
                  ) : (
                  <select
                    value={d.skillLevel}
                    onChange={(e) => update(d.id, { skillLevel: e.target.value })}
                    className="bg-black/30 border border-white/10 rounded-2xl px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-400/70"
                  >
                    <option value="AMATEUR">Amateur</option>
                    <option value="PROFESSIONAL">Professional</option>
                  </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {/* FFCS Only members are always enrolled, so their box is locked on */}
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-orange-100/70">
                    <input
                      type="checkbox"
                      checked={d.isFFCS || d.category === "FFCS_ONLY"}
                      disabled={readOnly || d.category === "FFCS_ONLY"}
                      onChange={(e) => update(d.id, { isFFCS: e.target.checked })}
                      className="h-4 w-4 accent-orange-500 disabled:opacity-60"
                    />
                    {d.isFFCS || d.category === "FFCS_ONLY" ? "Enrolled" : "No"}
                  </label>
                </td>
                <td className="px-4 py-3 text-right">
                  {!readOnly && d.id !== selfId &&
                    (d.category === "DANCER" ? (
                      <button
                        onClick={() => remove(d)}
                        title="Remove dancer (deletes their account)"
                        className="text-orange-100/50 hover:text-red-400 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => removeFromTeam(d)}
                        title="Remove from team (keeps their account)"
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-orange-100/60 hover:border-red-400/40 hover:text-red-300"
                      >
                        <UserMinus size={13} />
                        Remove from team
                      </button>
                    ))}
                </td>
              </tr>
            ))}
            {dancers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-orange-100/50">
                  No dancers in this team yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

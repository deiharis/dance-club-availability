"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { DANCER_ROLES } from "@/lib/teams";

type Dancer = {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  position: string | null;
  skillLevel: "PROFESSIONAL" | "AMATEUR";
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
};

const input =
  "w-full bg-[#0b0614] border border-fuchsia-950 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-fuchsia-500";

export default function RosterClient({
  team,
  dancers,
  selfId,
}: {
  team: string;
  dancers: Dancer[];
  selfId: string | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof emptyForm) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  async function setSkill(id: string, skillLevel: string) {
    setError("");
    const res = await fetch(`/api/dance/members/${id}/skill`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillLevel }),
    });
    if (!res.ok) setError((await res.json()).error ?? "Could not update");
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
      <div className="flex items-center justify-between">
        <p className="text-purple-200/60 text-sm">
          {dancers.length} dancer{dancers.length === 1 ? "" : "s"} in {team}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Add dancer
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={add}
          className="mt-4 grid sm:grid-cols-2 gap-3 bg-[#140a1f] border border-fuchsia-950 rounded-xl p-4"
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
          <input required type="password" minLength={6} placeholder="Temporary password" className={`${input} sm:col-span-2`} value={form.password} onChange={set("password")} />
          <button
            disabled={busy}
            className="sm:col-span-2 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
          >
            {busy ? "Adding..." : `Add to ${team}`}
          </button>
        </form>
      )}

      <div className="mt-4 bg-[#140a1f] border border-fuchsia-950 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-purple-300/50 text-xs border-b border-fuchsia-950">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Skill level</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {dancers.map((d) => (
              <tr key={d.id} className="border-b border-fuchsia-950/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{d.fullName}</p>
                  <p className="text-purple-300/50 text-xs">{d.registerNumber} · {d.email}</p>
                </td>
                <td className="px-4 py-3 text-purple-100/80">{d.position ?? "Dancer"}</td>
                <td className="px-4 py-3">
                  <select
                    value={d.skillLevel}
                    onChange={(e) => setSkill(d.id, e.target.value)}
                    className="bg-[#0b0614] border border-fuchsia-950 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                  >
                    <option value="AMATEUR">Amateur</option>
                    <option value="PROFESSIONAL">Professional</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  {d.id !== selfId && (
                    <button
                      onClick={() => remove(d)}
                      title="Remove dancer"
                      className="text-purple-300/50 hover:text-red-400 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {dancers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-purple-300/50">
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

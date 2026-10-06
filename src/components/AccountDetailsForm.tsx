"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import ProgrammeSelect from "@/components/ui/ProgrammeSelect";

const control =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/20";
const label = "mb-1.5 block text-[11px] font-medium text-zinc-400";

// "My details": the member's own phone, academic year and programme. PATCH /api/account/details.
export default function AccountDetailsForm({
  phone,
  academicYear,
  department,
  departmentValid,
  home,
}: {
  phone: string;
  academicYear: number;
  department: string;
  departmentValid: boolean;
  home: string;
}) {
  const [f, setF] = useState({
    phone,
    academicYear: String(academicYear),
    // Start empty when the saved course is not a real programme, so they actively choose.
    department: departmentValid ? department : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/account/details", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error || "Something went wrong");
    setF({ phone: data.phone ?? "", academicYear: String(data.academicYear), department: data.department });
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {!departmentValid && department && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Your programme needs updating. Currently saved: <span className="font-semibold">&ldquo;{department}&rdquo;</span>,
          which is not a recognised VIT Chennai programme (it may be a club team, or too general, e.g.
          &ldquo;Computer Science&rdquo; could be B.Tech CSE or B.Sc Computer Science).
        </p>
      )}
      <div>
        <label className={label}>Programme / course</label>
        <ProgrammeSelect value={f.department} onChange={(department) => setF({ ...f, department })} className={control} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Academic year</label>
          <select className={control} value={f.academicYear} onChange={(e) => setF({ ...f, academicYear: e.target.value })}>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Phone</label>
          <input
            className={control}
            inputMode="tel"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
            placeholder="9876543210"
          />
        </div>
      </div>
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      {saved && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={16} /> Saved.
          <Link href={home} className="ml-auto font-semibold text-emerald-200 hover:text-white">Continue</Link>
        </p>
      )}
      <button
        disabled={saving || !f.department}
        className="w-full rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save my details"}
      </button>
    </form>
  );
}

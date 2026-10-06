"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import ProgrammeSelect from "@/components/ui/ProgrammeSelect";

const control =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/20";

// The member's own course picker (app/programme). Saves through PATCH /api/account/programme.
export default function ProgrammeFixForm({ current, valid, home }: { current: string; valid: boolean; home: string }) {
  // Start empty when the saved value is not a real programme, so they must actively choose.
  const [department, setDepartment] = useState(valid ? current : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/account/programme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error || "Something went wrong");
    setSaved(data.department);
  }

  if (saved) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
        <p className="text-sm text-white">
          Saved. Your programme is now <span className="font-semibold">{saved}</span>.
        </p>
        <Link href={home} className="inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300">
          Continue
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {!valid && current && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Currently saved: <span className="font-semibold">&ldquo;{current}&rdquo;</span>. This could not be matched to a
          VIT Chennai programme. It may be a club team or too general (for example &ldquo;Computer Science&rdquo; could be
          B.Tech CSE or B.Sc Computer Science).
        </p>
      )}
      <ProgrammeSelect value={department} onChange={setDepartment} className={control} />
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      <button
        disabled={saving || !department}
        className="w-full rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save my programme"}
      </button>
    </form>
  );
}

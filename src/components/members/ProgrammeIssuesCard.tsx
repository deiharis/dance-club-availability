"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Bell, ChevronDown, Pencil } from "lucide-react";
import type { ProgrammeIssue } from "@/lib/programme-issues";

const ISSUE: Record<ProgrammeIssue["issue"], string> = {
  "not-a-programme": "Club team or school, not a course",
  ambiguous: "Too general / not a VIT Chennai programme",
  empty: "Blank",
};
const CATEGORY: Record<string, string> = { CORE: "Core", MEMBER: "Normal", DANCER: "Dancer", FFCS_ONLY: "FFCS only" };

// Members page, SuperAdmin only (the API answers 403 to anyone else, and then this renders
// nothing). Counts members whose Department/Course needs fixing, lists them, and can notify
// the ones not told yet. Refreshes when `refreshKey` changes (after imports, edits, deletes).
export default function ProgrammeIssuesCard({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<{ count: number; members: ProgrammeIssue[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  function load() {
    fetch("/api/members/programme-issues", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }
  useEffect(load, [refreshKey]);

  if (!data || data.count === 0) return null;
  const notNotified = data.members.filter((m) => !m.notified).length;

  async function notify() {
    setBusy(true);
    setNote("");
    const res = await fetch("/api/members/programme-issues", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setNote(res.ok ? `Notified ${d.notified} member${d.notified === 1 ? "" : "s"}.` : "Could not send notifications.");
    load();
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.06]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <GraduationCap size={18} className="shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Department data issues</p>
          <p className="text-xs text-amber-100/70">
            {data.count} member{data.count === 1 ? " needs" : "s need"} to update their programme
            {notNotified ? ` · ${notNotified} not notified yet` : " · all notified"}
          </p>
        </div>
        {notNotified > 0 && (
          <button
            onClick={notify}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
          >
            <Bell size={13} />
            {busy ? "Sending..." : `Notify ${notNotified}`}
          </button>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-400/10"
        >
          {open ? "Hide list" : "Show list"}
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {note && <p className="px-4 pb-2 text-xs text-amber-100/80">{note}</p>}
      {open && (
        <div className="max-h-80 overflow-y-auto border-t border-amber-400/15">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#16130c] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-2">Member</th>
                <th className="px-3 py-2">Saved as</th>
                <th className="px-3 py-2">Why</th>
                <th className="px-3 py-2">Notified</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.members.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-white">{m.fullName}</p>
                    <p className="font-mono text-zinc-500">{m.registerNumber} · {CATEGORY[m.category] ?? m.category}</p>
                  </td>
                  <td className="px-3 py-2 text-amber-100">&ldquo;{m.department || "blank"}&rdquo;</td>
                  <td className="px-3 py-2 text-zinc-400">{ISSUE[m.issue]}</td>
                  <td className="px-3 py-2">{m.notified ? <span className="text-emerald-300">Yes</span> : <span className="text-zinc-500">Not yet</span>}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/members/${m.id}/edit`} title="Edit this member" className="inline-flex rounded p-1.5 text-zinc-400 hover:bg-white/5 hover:text-violet-300">
                      <Pencil size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

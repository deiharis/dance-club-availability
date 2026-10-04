"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "PRESENT" | "ABSENT" | "EXCUSED";
type Dancer = { id: string; fullName: string; status: Status | null };

const OPTIONS: { value: Status; label: string; on: string }[] = [
  { value: "PRESENT", label: "Present", on: "bg-green-500/20 border-green-500/50 text-green-300" },
  { value: "ABSENT", label: "Absent", on: "bg-red-500/20 border-red-500/50 text-red-300" },
  { value: "EXCUSED", label: "Excused", on: "bg-amber-500/20 border-amber-500/50 text-amber-300" },
];

export default function AttendanceMarker({
  rehearsalId,
  dancers,
}: {
  rehearsalId: string;
  dancers: Dancer[];
}) {
  const router = useRouter();
  const [marks, setMarks] = useState<Record<string, Status | null>>(
    Object.fromEntries(dancers.map((d) => [d.id, d.status]))
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    // Only send dancers that have been marked; unmarked stay unmarked.
    const records = Object.entries(marks)
      .filter(([, s]) => s)
      .map(([memberId, status]) => ({ memberId, status }));
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/dance/rehearsals/${rehearsalId}/attendance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: (await res.json()).error ?? "Could not save" });
      return;
    }
    setMsg({ ok: true, text: `Saved ${records.length} record${records.length === 1 ? "" : "s"}.` });
    router.refresh();
  }

  const markedCount = Object.values(marks).filter(Boolean).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            setMarks(Object.fromEntries(dancers.map((d) => [d.id, "PRESENT" as Status])))
          }
          className="text-sm border border-white/10 hover:border-orange-500/40 text-orange-100/80 px-3 py-2 rounded-2xl"
        >
          Mark all present
        </button>
        <span className="text-orange-100/50 text-sm">
          {markedCount} of {dancers.length} marked
        </span>
      </div>

      <div className="mt-4 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border border-white/10 rounded-3xl divide-y divide-white/5">
        {dancers.map((d) => (
          <div
            key={d.id}
            className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <span className="text-white text-sm font-medium">{d.fullName}</span>
            <div className="flex gap-2">
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setMarks({ ...marks, [d.id]: o.value })}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    marks[d.id] === o.value
                      ? o.on
                      : "border-white/10 text-orange-100/60 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {dancers.length === 0 && (
          <p className="px-4 py-8 text-center text-orange-100/50 text-sm">
            No dancers in this team yet.
          </p>
        )}
      </div>

      {msg && (
        <p className={`mt-3 text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy || dancers.length === 0}
        className="mt-4 bg-orange-500 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-full"
      >
        {busy ? "Saving..." : "Save attendance"}
      </button>
    </div>
  );
}

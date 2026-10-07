"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Users } from "lucide-react";
import { useToast } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/states";

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
  const toast = useToast();
  const initial = () => Object.fromEntries(dancers.map((d) => [d.id, d.status]));
  const [saved, setSaved] = useState<Record<string, Status | null>>(initial);
  const [marks, setMarks] = useState<Record<string, Status | null>>(initial);
  const [busy, setBusy] = useState(false);

  const markedCount = Object.values(marks).filter(Boolean).length;
  const dirty = dancers.some((d) => marks[d.id] !== saved[d.id]);

  async function save() {
    // Only send dancers that have been marked; unmarked stay unmarked.
    const records = Object.entries(marks)
      .filter(([, s]) => s)
      .map(([memberId, status]) => ({ memberId, status }));
    setBusy(true);
    const res = await fetch(`/api/dance/rehearsals/${rehearsalId}/attendance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const error = res ? (await res.json().catch(() => ({}))).error : "Check your connection and try again.";
      toast.error("Attendance not saved", error ?? "Please try again.");
      return;
    }
    setSaved(marks);
    toast.success("Attendance saved", `${records.length} of ${dancers.length} dancer${dancers.length === 1 ? "" : "s"} marked.`);
    router.refresh();
  }

  if (dancers.length === 0) {
    return <EmptyState stage icon={Users} title="No dancers in this team yet" body="Add dancers on the Roster page, then mark attendance here." action={{ label: "Open roster", href: "/dance/roster" }} />;
  }

  return (
    <div>
      <button
        onClick={() => setMarks(Object.fromEntries(dancers.map((d) => [d.id, "PRESENT" as Status])))}
        className="press flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-orange-100/80 hover:border-orange-500/40 hover:text-white"
      >
        <CheckCheck size={15} aria-hidden="true" />
        Mark everyone present
      </button>

      <div className="mt-4 divide-y divide-white/5 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {dancers.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-medium text-white">{d.fullName}</span>
            <div className="flex gap-2" role="group" aria-label={`Attendance for ${d.fullName}`}>
              {OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setMarks({ ...marks, [d.id]: o.value })}
                  aria-pressed={marks[d.id] === o.value}
                  className={`press rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-120 ${
                    marks[d.id] === o.value ? o.on : "border-white/10 text-orange-100/60 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stays in view at the bottom of the screen on long team lists */}
      <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-black/70 py-2 pl-5 pr-2 backdrop-blur">
        <span className="text-sm text-orange-100/70" aria-live="polite">
          {markedCount} of {dancers.length} marked
          {dirty && <span className="ml-2 text-amber-300">· unsaved changes</span>}
        </span>
        <button
          onClick={save}
          disabled={busy || !dirty}
          className="press rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400 disabled:opacity-50"
        >
          {busy ? "Saving..." : dirty ? "Save attendance" : "Saved"}
        </button>
      </div>
    </div>
  );
}

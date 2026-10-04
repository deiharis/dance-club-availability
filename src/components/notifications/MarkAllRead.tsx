"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Marks one feed (Working Committee or Dance Floor) as read. `tone` picks the look:
// "console" = violet committee style, "stage" = Dance Floor pill.
export default function MarkAllRead({
  section,
  tone,
}: {
  section: "COMMITTEE" | "DANCE";
  tone: "console" | "stage";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section }),
    });
    setBusy(false);
    router.refresh(); // re-renders the sidebar badge too
  }

  const style =
    tone === "console"
      ? "rounded-md border border-zinc-700 text-zinc-200 hover:bg-white/5 hover:border-zinc-500 px-3 py-2 text-sm font-medium"
      : "rounded-full border border-white/10 text-orange-100/80 hover:border-orange-400/40 px-4 py-2 text-sm";

  return (
    <button
      onClick={markAll}
      disabled={busy}
      className={`${style} transition-colors disabled:opacity-50`}
    >
      {busy ? "Marking..." : "Mark all as read"}
    </button>
  );
}

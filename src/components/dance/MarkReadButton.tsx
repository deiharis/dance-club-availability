"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkReadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markAll() {
    setBusy(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setBusy(false);
    router.refresh(); // re-renders the sidebar badge too
  }

  return (
    <button
      onClick={markAll}
      disabled={busy}
      className="text-sm border border-white/10 hover:border-orange-500/40 disabled:opacity-50 text-orange-100/80 px-3 py-2 rounded-2xl"
    >
      {busy ? "Marking..." : "Mark all as read"}
    </button>
  );
}

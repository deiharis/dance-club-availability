"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

// SuperAdmin only (the Edit page shows it when the API says so; the API re-checks).
export default function ResetPassword({ memberId, name }: { memberId: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [temp, setTemp] = useState("");

  async function reset() {
    if (!confirm(`Reset ${name}'s password? Their current password stops working immediately.`)) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/members/${memberId}/password`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "Something went wrong");
    setTemp(data.tempPassword);
  }

  return (
    <div className="mt-6 rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-5 lg:max-w-[calc(100%-22rem)]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">Password</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm text-zinc-400">
          Forgot their password? Reset it to their register number. They must choose a new one when they next log in.
        </p>
        <button
          type="button"
          onClick={reset}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3.5 py-2 text-sm text-zinc-200 transition-colors hover:border-violet-400/50 hover:bg-violet-500/10 disabled:opacity-50"
        >
          <KeyRound size={15} />
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </div>
      {temp && (
        <p className="mt-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
          Done. Temporary password: <span className="font-mono font-semibold text-white">{temp}</span> (capital
          letters). Send it to {name}; they will be asked to change it after logging in.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

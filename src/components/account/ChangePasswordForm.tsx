"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { KeyRound, Check, Circle } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";

const input =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/20";
const label = "mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-zinc-500";

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Live ticks for the rules the browser can check. "Not your register number" is checked by the server.
  const rules = [
    { ok: next.length >= 8, text: "At least 8 characters" },
    { ok: next.length > 0 && next === confirm, text: "Both new passwords match" },
    { ok: next.length > 0 && next !== current, text: "Different from the current one" },
  ];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("The new passwords do not match");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setBusy(false);
      setError(res ? (await res.json().catch(() => ({}))).error ?? "Could not change password" : "Could not reach the server. Check your connection and try again.");
      return;
    }
    // Sign out so the new password is used for a fresh login (also clears the old session flag).
    await signOut({ callbackUrl: "/login?changed=1" });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
          <KeyRound size={18} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-base font-semibold text-white">{forced ? "Set your own password" : "Change password"}</h1>
          <p className="text-xs text-zinc-500">
            {forced
              ? "Your account uses a temporary password. Choose your own to continue."
              : "You will be signed out and asked to log in again."}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="pw-current" className={label}>
          {forced ? "Temporary password" : "Current password"}
        </label>
        <PasswordInput id="pw-current" required autoComplete="current-password" className={input} value={current} onChange={(e) => setCurrent(e.target.value)} />
        {forced && (
          <p className="mt-1.5 text-xs text-zinc-500">
            The password you just signed in with: your register number in capitals, or the one the committee gave you.
          </p>
        )}
      </div>
      <div>
        <label htmlFor="pw-new" className={label}>
          New password
        </label>
        <PasswordInput id="pw-new" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className={input} value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div>
        <label htmlFor="pw-confirm" className={label}>
          Confirm new password
        </label>
        <PasswordInput id="pw-confirm" required minLength={8} autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      <ul className="space-y-1" aria-label="Password rules">
        {rules.map((r) => (
          <li key={r.text} className={`flex items-center gap-2 text-xs transition-colors duration-200 ${r.ok ? "text-emerald-400" : "text-zinc-500"}`}>
            {r.ok ? <Check size={13} aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
            {r.text}
            <span className="sr-only">{r.ok ? "(done)" : "(not yet)"}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-xs text-zinc-500">
          <Circle size={13} aria-hidden="true" />
          Not your register number (checked when you save)
        </li>
      </ul>

      <button
        disabled={busy}
        className="press w-full rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 py-3 text-sm font-semibold text-stone-950 shadow-[0_0_30px_-8px_rgba(249,115,22,0.8)] transition hover:from-amber-200 hover:to-orange-400 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}

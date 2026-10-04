"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { KeyRound } from "lucide-react";

const input =
  "w-full rounded-lg border border-stone-700 bg-black/30 px-3 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    });
    if (!res.ok) {
      setBusy(false);
      setError((await res.json()).error ?? "Could not change password");
      return;
    }
    // Sign out so the new password is used for a fresh login (also clears the old session flag).
    await signOut({ callbackUrl: "/login?changed=1" });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300">
          <KeyRound size={18} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-white">
            {forced ? "Set your own password" : "Change password"}
          </h1>
          <p className="text-xs text-stone-500">
            {forced
              ? "Your account uses a temporary password. Choose a new one to continue."
              : "You will be signed out and asked to log in again."}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
          {forced ? "Temporary password (your register number)" : "Current password"}
        </label>
        <input type="password" required autoComplete="current-password" className={input} value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
          New password
        </label>
        <input type="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className={input} value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-stone-500">
          Confirm new password
        </label>
        <input type="password" required minLength={8} autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      <button
        disabled={busy}
        className="w-full rounded-lg bg-sky-500 py-2.5 text-sm font-medium text-stone-950 transition-colors hover:bg-sky-400 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}

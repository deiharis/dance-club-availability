"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Splash from "@/components/brand/Splash";
import { LogoLockup } from "@/components/brand/Logo";
import { brandFont } from "@/lib/fonts";
import PasswordInput from "@/components/ui/PasswordInput";

const input =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors focus:border-amber-400/70 focus:outline-none focus:ring-2 focus:ring-amber-400/20";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [idle, setIdle] = useState(false);
  // The form rises in as the intro splash dissolves (or straight away if the intro was already seen).
  const [ready, setReady] = useState(false);

  // Shown after /change-password signs the user out (?changed=1), or after 10 idle minutes (?idle=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setChanged(params.get("changed") === "1");
    setIdle(params.get("idle") === "1");
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    }).catch(() => null);

    if (!result) {
      setLoading(false);
      setError("Could not reach the server. Check your connection and try again.");
      return;
    }
    if (result.error) {
      setLoading(false);
      setError("Invalid email or password");
      return;
    }

    // Stay on "Signing in..." while the next page loads (it redirects by role).
    router.push("/");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0c] px-4 py-10">
      <Splash onDone={() => setReady(true)} />

      {/* Same spotlight as the end of the splash, so the hand-off feels continuous */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.12),transparent_65%)]" />

      <div className={`relative w-full max-w-md ${ready ? "anim-fade-up" : "login-pending"}`}>
        <div className={`mb-8 flex justify-center ${brandFont.className}`}>
          <LogoLockup size={68} stacked />
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
          <h1 className="text-base font-semibold text-white">Sign in</h1>
          <p className="mt-1 text-xs text-zinc-500">Members and dancers use their club account.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@vitstudent.ac.in"
                autoComplete="email"
                required
                className={input}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                Password
              </label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
                className={input}
              />
            </div>

            {changed && !error && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                <p className="text-sm text-green-400">Password updated. Sign in with your new password.</p>
              </div>
            )}

            {idle && !changed && !error && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                <p className="text-sm text-amber-200">You were signed out after 10 minutes of inactivity. Sign in again to continue.</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3" role="alert">
                <p className="text-sm text-red-400">{error}</p>
                {error.startsWith("Invalid") && (
                  <p className="mt-1 text-xs text-red-300/70">
                    Check for typing mistakes (the eye shows what you typed). Forgotten it? Ask the Super Admin to reset your password.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-b from-amber-300 to-orange-500 py-3 text-sm font-semibold text-stone-950 shadow-[0_0_30px_-8px_rgba(249,115,22,0.8)] transition hover:from-amber-200 hover:to-orange-400 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          New member? Ask your Core Team admin for access.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

// Signs the user out after 10 minutes with no mouse, keyboard, touch or scroll activity.
// Keep IDLE_MS in step with session.maxAge in lib/auth.ts (the server-side backstop for a
// closed browser or a sleeping laptop). The last-activity time is shared through localStorage,
// so working in one tab keeps every other tab signed in too.
const IDLE_MS = 10 * 60 * 1000;
const KEY = "dc-last-active";
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

export default function IdleLogout() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    let memory = Date.now(); // fallback when localStorage is blocked (private mode etc.)
    const read = () => {
      try {
        return Number(localStorage.getItem(KEY)) || memory;
      } catch {
        return memory;
      }
    };
    const write = (t: number) => {
      memory = t;
      try {
        localStorage.setItem(KEY, String(t));
      } catch {}
    };

    write(Date.now());
    let lastWrite = Date.now();
    let lastRenew = Date.now();

    // Activity: note the time (at most every 5s, mousemove fires constantly).
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 5000) {
        lastWrite = now;
        write(now);
      }
    };

    const check = () => {
      const now = Date.now();
      const last = read();
      if (now - last >= IDLE_MS) {
        signOut({ callbackUrl: "/login?idle=1" });
        return;
      }
      // Still active: renew the server-side login every 2 minutes (GET re-issues the cookie).
      if (now - last < 2 * 60 * 1000 && now - lastRenew > 2 * 60 * 1000) {
        lastRenew = now;
        fetch("/api/auth/session", { cache: "no-store" }).catch(() => {});
      }
    };

    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    // Checking timestamps (not one long timer) also catches a laptop waking from sleep.
    const timer = window.setInterval(check, 15000);
    document.addEventListener("visibilitychange", check);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [status]);

  return null;
}

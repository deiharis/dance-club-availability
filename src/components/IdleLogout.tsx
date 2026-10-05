"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { TABS_KEY, TAB_FLAG, TAB_ALIVE_MS } from "@/lib/tab-session";

// Signs the user out after 10 minutes with no mouse, keyboard, touch or scroll activity.
// Keep IDLE_MS in step with session.maxAge in lib/auth.ts (the server-side backstop for a
// closed browser or a sleeping laptop). The last-activity time is shared through localStorage,
// so working in one tab keeps every other tab signed in too.
const IDLE_MS = 10 * 60 * 1000;
const KEY = "dc-last-active";
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

export default function IdleLogout() {
  const { status } = useSession();

  // Closing every tab logs you out (see lib/tab-session.ts). The early script marked this page
  // locked if it opened in a new tab with no other tab of the site alive.
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-locked") || status === "loading") return;
    if (status === "authenticated") signOut({ callbackUrl: "/login" });
    else root.removeAttribute("data-locked"); // not signed in anyway: nothing to hide
  }, [status]);

  // Heartbeat: this tab is open. Removed when the tab closes, so the last tab closing ends it.
  useEffect(() => {
    if (status !== "authenticated" || document.documentElement.hasAttribute("data-locked")) return;
    const id = Math.random().toString(36).slice(2); // per page load; a refresh gets a new one
    const edit = (fn: (tabs: Record<string, number>) => void) => {
      try {
        const tabs: Record<string, number> = JSON.parse(localStorage.getItem(TABS_KEY) || "{}");
        fn(tabs);
        localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
      } catch {}
    };
    const beat = () =>
      edit((tabs) => {
        const now = Date.now();
        for (const k in tabs) if (now - tabs[k] > TAB_ALIVE_MS) delete tabs[k]; // crashed tabs
        tabs[id] = now;
      });
    const bye = () => edit((tabs) => delete tabs[id]);

    try {
      sessionStorage.setItem(TAB_FLAG, "1");
    } catch {}
    beat();
    const timer = window.setInterval(beat, 5000);
    window.addEventListener("pageshow", beat);
    window.addEventListener("pagehide", bye);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pageshow", beat);
      window.removeEventListener("pagehide", bye);
      bye();
    };
  }, [status]);

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

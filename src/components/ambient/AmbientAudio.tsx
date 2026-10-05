"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";

// Quiet background music: a royalty-free instrumental track at public/audio/ambient.mp3
// (soft piano / ambient pads, no beats, no vocals). If the file is not there, nothing plays and
// the speaker button stays hidden.
//
// Seamless loop: two <audio> copies of the track crossfade over XF seconds at the end, so there is
// no gap or hard restart even if the track was not made to loop. Volume and fades go through Web
// Audio gain nodes (iPhones ignore <audio>.volume).
//
// Browser autoplay rules: nothing is created or played before the visitor's first click, tap or
// key press; it all starts inside that gesture (required by Safari), so browsers have nothing to
// block. Clicking to skip the intro counts, so the music fades in as the login form appears, and
// it keeps playing (never restarts) from the intro into the login page.
//
// Plays on every page. Moving to a different section (login, Dance Floor, committee console /
// member portal) gives a soft "breath": the music dips and swells back, it never stops or restarts.
// On/off is remembered per device in localStorage.
const SRC = "/audio/ambient.mp3";
const KEY = "dc-ambient-sound";
const VOLUME = 0.22; // master level when on. Music files are mastered loud, so keep this low.
const FADE = 0.7; // seconds (time constant; ~2s to settle)
const XF = 4; // loop crossfade, seconds
// Sections for the transition. The console and member portal share URLs (/timetable,
// /reports/submit) and nobody moves between them, so they count as one.
const sectionOf = (path: string) => (path === "/login" ? "login" : path.startsWith("/dance") ? "dance" : "main");
const DIP = 0.3; // during a section change, the music dips to 30% of its level, then swells back

type Deck = { el: HTMLAudioElement; gain: GainNode };
type Engine = { ctx: AudioContext; master: GainNode; decks: [Deck, Deck]; active: 0 | 1; crossing: boolean };

function buildEngine(): Engine | null {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const deck = (): Deck => {
    const el = new Audio(SRC);
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(master);
    return { el, gain };
  };
  const e: Engine = { ctx, master, decks: [deck(), deck()], active: 0, crossing: false };
  e.decks[0].gain.gain.value = 1;

  // Near the end of the playing copy, start the other from the top and crossfade.
  e.decks.forEach((d, i) => {
    d.el.addEventListener("timeupdate", () => {
      if (e.active !== i || e.crossing || !d.el.duration || d.el.duration - d.el.currentTime > XF) return;
      const next = e.decks[(1 - i) as 0 | 1];
      e.crossing = true;
      next.el.currentTime = 0;
      next.el.play().catch(() => {});
      const now = ctx.currentTime;
      next.gain.gain.cancelScheduledValues(now);
      next.gain.gain.setValueAtTime(0, now);
      next.gain.gain.linearRampToValueAtTime(1, now + XF);
      d.gain.gain.cancelScheduledValues(now);
      d.gain.gain.setValueAtTime(d.gain.gain.value, now);
      d.gain.gain.linearRampToValueAtTime(0, now + XF);
      e.active = (1 - i) as 0 | 1;
      setTimeout(() => {
        d.el.pause();
        e.crossing = false;
      }, XF * 1000 + 200);
    });
  });
  return e;
}

export default function AmbientAudio() {
  const pathname = usePathname() ?? "";
  const engine = useRef<Engine | null>(null);
  const [available, setAvailable] = useState(false); // does public/audio/ambient.mp3 exist?
  const [enabled, setEnabled] = useState(true); // preference
  // Bumped every time the engine is unlocked by a click, so the play/fade effect re-runs.
  const [unlocks, setUnlocks] = useState(0);

  // Read the preference, and check the track exists (a HEAD request, nothing is downloaded).
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(KEY) !== "off");
    } catch {}
    fetch(SRC, { method: "HEAD" })
      .then((r) => setAvailable(r.ok && (r.headers.get("content-type") ?? "").startsWith("audio")))
      .catch(() => setAvailable(false));
  }, []);

  // Inside a click/tap: create the engine and start the track (silent until faded in). Safari also
  // needs the second copy "unlocked" in the same gesture so the loop crossfade can start it later.
  const unlock = useCallback(() => {
    if (!engine.current) engine.current = buildEngine();
    const e = engine.current;
    if (!e) return;
    e.ctx.resume().catch(() => {});
    const [a, b] = e.decks;
    const playing = e.decks[e.active];
    if (playing.el.paused) playing.el.play().catch(() => {});
    if (b !== playing && b.el.paused && b.el.currentTime === 0) b.el.play().then(() => b.el.pause()).catch(() => {});
    if (a !== playing && a.el.paused && a.el.currentTime === 0) a.el.play().then(() => a.el.pause()).catch(() => {});
  }, []);

  // Wait for a real interaction before touching audio at all.
  useEffect(() => {
    if (!available || !enabled || engine.current) return;
    const go = () => {
      unlock();
      setUnlocks((n) => n + 1);
    };
    const opts = { once: true, capture: true } as const;
    window.addEventListener("pointerdown", go, opts);
    window.addEventListener("keydown", go, opts);
    return () => {
      window.removeEventListener("pointerdown", go, opts);
      window.removeEventListener("keydown", go, opts);
    };
  }, [available, enabled, unlock]);

  const fadeTo = useCallback((target: number) => {
    const e = engine.current;
    if (!e) return;
    const now = e.ctx.currentTime;
    e.master.gain.cancelScheduledValues(now);
    e.master.gain.setValueAtTime(e.master.gain.value, now);
    e.master.gain.setTargetAtTime(target, now, FADE);
  }, []);

  // Play when: track exists, preference on, visitor has interacted, tab visible.
  useEffect(() => {
    if (!available || unlocks === 0) return;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;

    const apply = () => {
      const want = enabled && document.visibilityState === "visible";
      clearTimeout(pauseTimer);
      const e = engine.current;
      if (want) {
        if (!e) return; // created by the next click (unlock)
        e.ctx.resume().catch(() => {});
        const playing = e.decks[e.active];
        if (playing.el.paused) playing.el.play().catch(() => {}); // continues where it stopped
        fadeTo(VOLUME);
      } else if (e) {
        fadeTo(0);
        // After the fade, pause (keeps the position) so it costs no CPU, data or battery.
        pauseTimer = setTimeout(() => {
          e.decks.forEach((d) => d.el.pause());
          e.ctx.suspend().catch(() => {});
        }, FADE * 4000);
      }
    };

    apply();
    document.addEventListener("visibilitychange", apply);
    return () => {
      clearTimeout(pauseTimer);
      document.removeEventListener("visibilitychange", apply);
    };
  }, [available, unlocks, enabled, fadeTo]);

  // Section change: dip and swell back, so moving between portals feels like a transition.
  const section = sectionOf(pathname);
  const lastSection = useRef(section);
  useEffect(() => {
    if (lastSection.current === section) return;
    lastSection.current = section;
    const e = engine.current;
    if (!e || !enabled || e.ctx.state !== "running") return;
    const now = e.ctx.currentTime;
    const g = e.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.setTargetAtTime(VOLUME * DIP, now, 0.25); // down over ~0.7s
    g.setTargetAtTime(VOLUME, now + 0.9, 0.6); // back up over ~1.8s
  }, [section, enabled]);

  if (!available) return null;

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      unlock(); // this click is itself the interaction
      setUnlocks((n) => n + 1);
    }
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Background music on. Turn off" : "Background music off. Turn on"}
      title={enabled ? "Background music on" : "Background music off"}
      className="ambient-toggle fixed bottom-4 right-4 z-[90] flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/45 backdrop-blur-sm transition-colors hover:border-amber-300/40 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
    >
      {enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
    </button>
  );
}

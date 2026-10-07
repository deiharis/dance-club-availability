"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

// App-wide feedback, mounted once in app/providers.tsx:
//   const toast = useToast();     toast.success("Rehearsal created")   toast.error("Could not save", "reason")
//   const confirm = useConfirm(); if (!(await confirm({ title, body, confirmLabel, tone: "danger" }))) return;
// Both follow the section you are in: violet and squarer in the Working Committee, gold and
// rounder on the Dance Floor. Toasts are announced to screen readers (aria-live). The dialog
// replaces browser confirm()/prompt(): Esc cancels, Tab stays inside it, focus returns afterwards,
// and dangerous actions start focused on the safe button. Motion is off for reduced-motion users.

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; tone: Tone; title: string; detail?: string };
type ConfirmOptions = {
  title: string;
  body?: React.ReactNode; // explain the consequence
  confirmLabel?: string; // e.g. "Cancel rehearsal"
  cancelLabel?: string;
  tone?: "danger" | "default";
  requireText?: string; // e.g. "DELETE": the confirm button unlocks only when this is typed
};

const ToastCtx = createContext<{ show: (tone: Tone, title: string, detail?: string) => void } | null>(null);
const ConfirmCtx = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast needs FeedbackProvider");
  return {
    success: (title: string, detail?: string) => ctx.show("success", title, detail),
    error: (title: string, detail?: string) => ctx.show("error", title, detail),
    info: (title: string, detail?: string) => ctx.show("info", title, detail),
  };
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm needs FeedbackProvider");
  return ctx;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const stage = (usePathname() ?? "").startsWith("/dance");

  // ── Toasts ───────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (tone: Tone, title: string, detail?: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, tone, title, detail }]); // at most 3 on screen
      setTimeout(() => dismiss(id), tone === "error" ? 6500 : 3500);
    },
    [dismiss]
  );

  // ── Confirm dialog ───────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })),
    []
  );
  const close = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  return (
    <ToastCtx.Provider value={{ show }}>
      <ConfirmCtx.Provider value={confirm}>
        {children}
        {dialog && <ConfirmDialog key={dialog.title} {...dialog} stage={stage} onClose={close} />}
        <div
          aria-live="polite"
          aria-atomic="false"
          className="pointer-events-none fixed inset-x-0 bottom-16 z-[130] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        >
          {toasts.map((t) => (
            <ToastView key={t.id} t={t} stage={stage} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}

const TONE = {
  success: { icon: CheckCircle2, color: "text-emerald-400" },
  error: { icon: AlertTriangle, color: "text-red-400" },
  info: { icon: Info, color: "text-sky-300" },
} as const;

function ToastView({ t, stage, onClose }: { t: ToastItem; stage: boolean; onClose: () => void }) {
  const { icon: Icon, color } = TONE[t.tone];
  return (
    <div
      role={t.tone === "error" ? "alert" : "status"}
      className={`fb-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 text-sm shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md ${
        stage ? "rounded-2xl border-orange-300/20 bg-[#15100b]/95" : "rounded-lg border-white/10 bg-surface/95"
      }`}
    >
      <Icon size={17} className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{t.title}</p>
        {t.detail && <p className="mt-0.5 text-xs text-zinc-400">{t.detail}</p>}
      </div>
      <button onClick={onClose} aria-label="Dismiss" className="-mr-1 rounded p-1 text-zinc-500 hover:text-white">
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  requireText,
  stage,
  onClose,
}: ConfirmOptions & { stage: boolean; onClose: (ok: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const danger = tone === "danger";
  const locked = !!requireText && typed.trim().toUpperCase() !== requireText.toUpperCase();

  // Focus: the text box if typing is required, else the SAFE button for dangerous actions.
  // Put focus back where it was when the dialog closes.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>(requireText ? "input" : danger ? "[data-cancel]" : "[data-ok]");
    first?.focus();
    return () => before?.focus?.();
  }, [danger, requireText]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(false);
    }
    if (e.key === "Tab") {
      // Keep Tab inside the dialog.
      const items = Array.from(box.current?.querySelectorAll<HTMLElement>("button, input") ?? []).filter((x) => !x.hasAttribute("disabled"));
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
      e.preventDefault();
      items[next].focus();
    }
  }

  const accent = stage ? "bg-orange-500 hover:bg-orange-400" : "bg-violet-600 hover:bg-violet-500";
  const okClass = danger ? "bg-red-600 hover:bg-red-500" : accent;
  const radius = stage ? "rounded-3xl" : "rounded-xl";
  const btnRadius = stage ? "rounded-full" : "rounded-md";

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center p-4 sm:items-center" onKeyDown={onKey}>
      <div className="fb-backdrop absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => onClose(false)} />
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="fb-title"
        aria-describedby={body ? "fb-body" : undefined}
        className={`fb-dialog relative w-full max-w-md border p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ${radius} ${
          stage ? "border-orange-300/20 bg-[#140f0b]" : "border-white/10 bg-surface"
        }`}
      >
        <div className="flex items-start gap-3">
          {danger && (
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center bg-red-500/15 text-red-400 ${stage ? "rounded-full" : "rounded-lg"}`}>
              <AlertTriangle size={18} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="fb-title" className="text-base font-semibold text-white">{title}</h2>
            {body && <div id="fb-body" className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</div>}
          </div>
        </div>

        {requireText && (
          <label className="mt-5 block">
            <span className="text-xs text-zinc-400">
              Type <span className="font-mono font-semibold text-white">{requireText}</span> to confirm
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !locked) onClose(true);
              }}
              autoComplete="off"
              className={`mt-1.5 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-red-400/60 focus:outline-none ${stage ? "rounded-2xl" : "rounded-md"}`}
            />
          </label>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            data-cancel
            onClick={() => onClose(false)}
            className={`border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 ${btnRadius}`}
          >
            {cancelLabel}
          </button>
          <button
            data-ok
            disabled={locked}
            onClick={() => onClose(true)}
            className={`px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${okClass} ${btnRadius}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

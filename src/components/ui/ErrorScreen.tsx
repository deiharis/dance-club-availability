"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WifiOff, RotateCw, Home } from "lucide-react";

// Friendly replacement for Next.js's error screen (used by the error.tsx files). The usual cause
// is a brief network / database hiccup, so the main action is "Try again" (re-renders the page).
// `digest` is the code in the server logs, shown small so it can be reported.
export default function ErrorScreen({
  error,
  reset,
  variant,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  variant: "console" | "stage" | "plain";
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const stage = variant === "stage";
  const btn = stage
    ? "rounded-full bg-orange-500 hover:bg-orange-400 shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)]"
    : "rounded-md bg-violet-600 hover:bg-violet-500";
  const ghost = stage ? "rounded-full" : "rounded-md";

  return (
    <div className={`flex min-h-[70vh] items-center justify-center p-6 ${variant === "plain" ? "min-h-screen bg-base text-white" : ""}`}>
      <div className={`page-enter w-full max-w-md border p-8 text-center ${stage ? "rounded-3xl border-white/10 bg-white/[0.04]" : "rounded-xl border-white/10 bg-surface"}`}>
        <span className={`mx-auto flex h-12 w-12 items-center justify-center ${stage ? "rounded-full bg-orange-500/15 text-orange-300" : "rounded-lg bg-violet-500/15 text-violet-300"}`}>
          <WifiOff size={22} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-white">This page did not load</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          This is usually a brief connection problem between the site and its database. Check your internet and try
          again. Nothing you saved has been lost.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={reset} className={`press inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white ${btn}`}>
            <RotateCw size={15} aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className={`press inline-flex items-center justify-center gap-2 border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/5 ${ghost}`}
          >
            <Home size={15} aria-hidden="true" />
            Go to my home page
          </Link>
        </div>
        {error.digest && <p className="mt-5 text-[11px] text-zinc-600">Error code {error.digest}</p>}
      </div>
    </div>
  );
}

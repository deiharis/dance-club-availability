import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Shared loading and empty states (Working Committee "console" and Dance Floor "stage" skins).
// Skeleton: a placeholder block the same size as the content it stands in for, so nothing jumps
// when the data arrives. Shimmer is off for reduced-motion users (globals.css .sk).

export function Skeleton({ className = "", stage = false }: { className?: string; stage?: boolean }) {
  return <div aria-hidden="true" className={`sk ${stage ? "sk-stage rounded-2xl" : "rounded-md"} ${className}`} />;
}

// EmptyState: what is (not) here, why, and the next step, instead of a bare "Nothing here".
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  stage = false,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  stage?: boolean;
  compact?: boolean;
}) {
  const actionClass = stage
    ? "rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] hover:bg-orange-400"
    : "rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500";
  return (
    <div
      className={`flex flex-col items-center text-center ${compact ? "px-4 py-8" : "px-6 py-14"} ${
        stage
          ? "rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01]"
          : "rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent"
      }`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center ${
          stage ? "rounded-full bg-orange-500/15 text-orange-300" : "rounded-lg bg-violet-500/15 text-violet-300"
        }`}
      >
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      {body && <p className={`mt-1 max-w-sm text-sm ${stage ? "text-orange-100/55" : "text-zinc-400"}`}>{body}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className={`mt-5 ${actionClass}`}>
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className={`mt-5 ${actionClass}`}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

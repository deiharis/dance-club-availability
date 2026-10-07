import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Sparkles } from "lucide-react";
import type { OnboardingStep } from "@/lib/onboarding";

// "Finish setting up" card. Renders nothing once every step is done.
// console: violet card (member portal, committee dashboard). pill: one compact line for the
// Dance Floor home, which must stay one screen tall; it links to the next open step.
export default function OnboardingChecklist({ steps, variant = "console" }: { steps: OnboardingStep[]; variant?: "console" | "pill" }) {
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  if (!next) return null;

  if (variant === "pill") {
    return (
      <Link
        href={next.href}
        className="group mx-auto flex w-fit max-w-full items-center gap-2 rounded-full border border-amber-300/30 bg-black/40 px-4 py-2 text-xs text-amber-50/90 backdrop-blur transition hover:border-amber-300/60"
      >
        <Sparkles size={13} className="shrink-0 text-amber-300" aria-hidden="true" />
        <span className="truncate">
          Finish setting up ({done} of {steps.length}): <span className="font-semibold text-white">{next.label.toLowerCase()}</span>
        </span>
        <ArrowRight size={13} className="shrink-0 text-amber-300 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <section aria-labelledby="onboarding-h" className="rounded-xl border border-violet-400/30 bg-gradient-to-b from-violet-500/[0.08] to-transparent p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="onboarding-h" className="text-sm font-bold text-white">
          Finish setting up
        </h2>
        <p className="text-xs tabular-nums text-violet-200">
          {done} of {steps.length} done
        </p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 space-y-1">
        {steps.map((s) => (
          <li key={s.key}>
            {s.done ? (
              <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
                <span className="text-sm text-zinc-500 line-through decoration-zinc-600">{s.label}</span>
                <span className="sr-only">(done)</span>
              </div>
            ) : (
              <Link href={s.href} className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-200 hover:bg-white/[0.04]">
                <Circle size={16} className="shrink-0 text-violet-300" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">{s.label}</span>
                  <span className="block text-xs text-zinc-500">{s.hint}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300" aria-hidden="true" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

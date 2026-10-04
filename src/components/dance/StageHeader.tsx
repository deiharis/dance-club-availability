import React from "react";

// Page header for Dance Floor inner pages: pill label, big light headline with a
// gold accent word, subtitle, and a faint glowing rule. `children` goes on the right.
export default function StageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-100/70">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.7)]" />
              {eyebrow}
            </span>
          )}
          <h1 className="mt-4 text-4xl font-light tracking-tight text-white sm:text-5xl">
            {title}
            {accent && (
              <>
                {" "}
                <span className="bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                  {accent}
                </span>
              </>
            )}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-sm text-amber-50/60">{subtitle}</p>
          )}
        </div>
        {children && <div className="shrink-0 pt-1">{children}</div>}
      </div>
      <div className="mt-6 h-px bg-gradient-to-r from-amber-300/40 via-white/10 to-transparent" />
    </header>
  );
}

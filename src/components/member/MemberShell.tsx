"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Calendar, FileText, KeyRound, LogOut } from "lucide-react";
import { LogoMark, LogoLockup } from "@/components/brand/Logo";
import { consoleFont, brandFont } from "@/lib/fonts";

// Frame for the pages Normal Members and FFCS-only members use: a slim top bar with the
// club logo and four links, in the violet console style. (Committee users get the sidebar
// console and dancers get Dance Floor, so they never see this.)
const LINKS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/timetable", label: "Timetable", icon: Calendar },
  { href: "/reports/submit", label: "My reports", icon: FileText },
];

export default function MemberShell({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`${consoleFont.className} committee-ui min-h-screen bg-base text-white`}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0c]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-8">
          <Link href="/profile" className={`shrink-0 ${brandFont.className}`} aria-label="Dance Club VIT Chennai">
            <span className="hidden sm:block">
              <LogoLockup size={34} variant="white" />
            </span>
            <span className="sm:hidden">
              <LogoMark size={34} variant="white" />
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {LINKS.map((l) => {
              const Icon = l.icon;
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-violet-500/15 text-violet-200" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden md:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 border-l border-white/10 pl-3">
            <div
              title={name}
              className="mr-1 hidden h-8 w-8 items-center justify-center rounded bg-zinc-800 text-xs font-semibold text-zinc-300 sm:flex"
            >
              {initials || "?"}
            </div>
            <Link href="/change-password" title="Change password" className="rounded p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
              <KeyRound size={16} />
            </Link>
            <Link href="/api/auth/signout" title="Sign out" className="rounded p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}

// Page title used inside the shell: small violet label, bold title, subtitle, optional right-hand action.
export function MemberHeading({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">{label}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

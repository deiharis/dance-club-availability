"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Calendar, FileText, KeyRound, LogOut, Music, UserCog } from "lucide-react";
import { LogoMark, LogoLockup } from "@/components/brand/Logo";
import { consoleFont, brandFont } from "@/lib/fonts";

// Frame for the pages Normal Members and FFCS-only members use, in the violet console style.
// Desktop/tablet: a slim top bar with the club logo, the links and the account actions.
// Phone: the top bar keeps the logo and account actions, and the links move to a LABELLED
// bottom tab bar (easy to reach with a thumb). (Committee users get the sidebar console and
// dancers get Dance Floor, so they never see this.)
const LINKS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/timetable", label: "Timetable", icon: Calendar },
  { href: "/reports/submit", label: "My reports", icon: FileText },
];

export default function MemberShell({
  name,
  inTeam = false,
  children,
}: {
  name: string;
  inTeam?: boolean; // member also dances in a team -> show a Dance Floor link
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = inTeam ? [...LINKS, { href: "/dance", label: "Dance Floor", icon: Music }] : LINKS;
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

          <nav className="ml-auto hidden md:flex items-center gap-1" aria-label="Main">
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`press flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                    active ? "bg-violet-500/15 text-violet-200" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto md:ml-0 flex shrink-0 items-center gap-1 md:border-l md:border-white/10 md:pl-3">
            <div
              title={name}
              className="mr-1 hidden h-8 w-8 items-center justify-center rounded bg-zinc-800 text-xs font-semibold text-zinc-300 sm:flex"
            >
              {initials || "?"}
            </div>
            <Link href="/account" title="My details" aria-label="My details" className="rounded p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
              <UserCog size={16} />
            </Link>
            <Link href="/change-password" title="Change password" aria-label="Change password" className="rounded p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
              <KeyRound size={16} />
            </Link>
            <Link href="/api/auth/signout" title="Sign out" aria-label="Sign out" className="rounded p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* pb-24 on phones keeps content clear of the bottom tab bar */}
      <main className="page-enter mx-auto max-w-5xl px-4 pt-6 pb-24 sm:px-8 sm:pt-8 md:pb-8">{children}</main>

      {/* Phone: labelled bottom tab bar */}
      <nav
        aria-label="Main"
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a0a0c]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      >
        <div className={`grid ${links.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`press relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                  active ? "text-violet-200" : "text-zinc-500"
                }`}
              >
                {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-violet-400" aria-hidden="true" />}
                <Icon size={19} aria-hidden="true" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
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

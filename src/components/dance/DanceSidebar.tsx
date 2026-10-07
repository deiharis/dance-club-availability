"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Bell,
  BarChart3,
  Grid3x3,
  Star,
  Users,
  FileText,
  LogOut,
  KeyRound,
  UserCog,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { useSlidingIndicator } from "@/components/layout/useSlidingIndicator";

interface DanceSidebarProps {
  userName: string;
  userEmail: string;
  label: string; // e.g. "Dance Lead", "Dancer", "Super Admin"
  canManage: boolean; // Dance Lead or committee
  isCommittee: boolean; // SuperAdmin or Core: gets a link back to the committee console
  badges?: Record<string, number>; // count shown next to a nav item, keyed by href
}

// Only link pages that exist.
const navItems = [
  { href: "/dance", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dance/roster", label: "Roster", icon: Users, manageOnly: true },
  { href: "/dance/rehearsals", label: "Rehearsals", icon: CalendarDays },
  { href: "/dance/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/dance/performances", label: "Performances", icon: Star },
  { href: "/dance/analytics", label: "Team insights", icon: BarChart3, manageOnly: true },
  { href: "/dance/availability", label: "Availability", icon: Grid3x3, manageOnly: true },
  { href: "/dance/timetable", label: "Timetable", icon: Calendar },
  { href: "/dance/reports", label: "Review reports", icon: ClipboardList, leadOnly: true },
  { href: "/dance/my-reports", label: "My Reports", icon: FileText },
  { href: "/dance/notifications", label: "Notifications", icon: Bell },
];

export default function DanceSidebar({
  userName,
  userEmail,
  label,
  canManage,
  isCommittee,
  badges = {},
}: DanceSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    return href === "/dance" ? pathname === "/dance" : pathname.startsWith(href);
  }

  // The most specific matching link is the active one.
  const activeHref =
    navItems.map((i) => i.href).filter(isActive).sort((a, b) => b.length - a.length)[0] ?? "";

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const items = navItems
    .filter((i) => canManage || !("manageOnly" in i))
    .filter((i) => (canManage && !isCommittee) || !("leadOnly" in i))
    // Committee members file their reports (with OD) in the console, not the dancer version.
    .map((i) => (i.href === "/dance/my-reports" && isCommittee ? { ...i, href: "/reports/submit" } : i));

  const content = (
    <div className="relative flex flex-col h-full">
      {/* Stage glow at the bottom of the panel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.35),transparent_70%)]" />

      {/* Brand */}
      <div className="relative px-6 pt-6 pb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={34} />
            <span className="text-white text-xl font-light tracking-tight">
              Dance Floor
            </span>
          </div>
          <span className="inline-block mt-2.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-orange-100/60">
            Stage
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="lg:hidden -m-2 flex h-10 w-10 items-center justify-center rounded-full text-orange-100/70 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Pill navigation; the glowing pill glides to the active link */}
      <DanceNav items={items} activeHref={activeHref} badges={badges} />

      {/* User card */}
      <div className="relative p-3 space-y-2">
        {isCommittee && (
          <Link
            href="/dashboard"
            className="flex items-center justify-between rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-orange-50/70 hover:text-white hover:border-orange-400/40 transition-colors"
          >
            Committee console
            <ArrowUpRight size={14} />
          </Link>
        )}
        {/* Account: full name and role, then the three actions in a row */}
        <div className="rounded-3xl border border-white/10 bg-black/30 p-3 backdrop-blur" title={userEmail}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-orange-300 to-orange-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {initials || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium leading-snug line-clamp-2 break-words">{userName}</p>
              <p className="text-orange-200 text-[11px]">{label}</p>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1">
            {[
              { href: "/account", label: "My details", icon: UserCog },
              { href: "/change-password", label: "Password", icon: KeyRound },
              { href: "/api/auth/signout", label: "Sign out", icon: LogOut },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                title={a.label}
                className="press flex flex-col items-center gap-1 rounded-full py-1.5 text-[10px] text-orange-100/55 hover:bg-white/5 hover:text-white"
              >
                <a.icon size={15} aria-hidden="true" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: floating pill bar */}
      <div className="lg:hidden fixed top-3 left-3 right-3 z-30 h-12 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="text-white font-light tracking-tight">Dance Floor</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-orange-100/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: floating glass drawer */}
      <aside
        className={`lg:hidden fixed top-3 bottom-3 left-3 w-72 max-w-[85vw] z-50 rounded-[2rem] border border-white/10 bg-[#140a06]/95 backdrop-blur-xl overflow-hidden transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        {content}
      </aside>

      {/* Desktop: floating glass panel */}
      <aside className="hidden lg:block fixed top-4 bottom-4 left-4 w-64 z-10 rounded-[2rem] border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        {content}
      </aside>
    </>
  );
}

type DanceNavItem = { href: string; label: string; icon: React.ElementType };

// Stable list (desktop and drawer each have their own) so the glowing pill glides between links.
function DanceNav({ items, activeHref, badges }: { items: DanceNavItem[]; activeHref: string; badges: Record<string, number> }) {
  const { navRef, indicator } = useSlidingIndicator(activeHref);
  return (
    <nav ref={navRef} className="relative flex-1 overflow-y-auto px-3 py-1 space-y-0.5 [mask-image:linear-gradient(to_bottom,black_calc(100%-1.5rem),transparent)]">
      <span
        aria-hidden="true"
        className="nav-indicator inset-x-3 rounded-full border border-orange-400/40 bg-gradient-to-r from-orange-500/30 to-orange-500/5 shadow-[inset_0_0_24px_-10px_rgba(251,146,60,0.9)]"
        style={indicator}
      />
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === activeHref;
        const count = badges[item.href] ?? 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active || undefined}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-full border border-transparent pl-1.5 pr-3 py-1.5 text-sm transition-colors duration-200 ${
              active ? "text-white" : "text-orange-50/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
                active ? "bg-orange-500 text-white" : "bg-white/5"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </span>
            {item.label}
            {count > 0 && (
              <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

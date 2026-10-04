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
  Star,
  Users,
  FileText,
  LogOut,
  KeyRound,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

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

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const items = navItems
    .filter((i) => canManage || !("manageOnly" in i))
    .filter((i) => (canManage && !isCommittee) || !("leadOnly" in i));

  const content = (
    <div className="relative flex flex-col h-full">
      {/* Stage glow at the bottom of the panel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.35),transparent_70%)]" />

      {/* Brand */}
      <div className="relative px-6 pt-7 pb-5 flex items-start justify-between">
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
          className="lg:hidden text-orange-100/70 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Pill navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const count = badges[item.href] ?? 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-full border pl-2 pr-3 py-2 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/60 ${
                active
                  ? "border-orange-400/40 bg-gradient-to-r from-orange-500/30 to-orange-500/5 text-white shadow-[inset_0_0_24px_-10px_rgba(251,146,60,0.9)]"
                  : "border-transparent text-orange-50/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  active ? "bg-orange-500 text-white" : "bg-white/5"
                }`}
              >
                <Icon size={15} />
              </span>
              {item.label}
              {count > 0 && (
                <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

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
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-black/30 p-3 backdrop-blur">
          <div className="w-9 h-9 rounded-full bg-gradient-to-b from-orange-300 to-orange-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-orange-200 text-[11px] truncate">{label}</p>
            <p className="text-orange-100/40 text-[10px] truncate">{userEmail}</p>
          </div>
          <Link
            href="/change-password"
            title="Change password"
            className="text-orange-100/60 hover:text-white p-1.5"
          >
            <KeyRound size={16} />
          </Link>
          <Link
            href="/api/auth/signout"
            title="Sign out"
            className="text-orange-100/60 hover:text-white p-1.5"
          >
            <LogOut size={16} />
          </Link>
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
          className="text-orange-100/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
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

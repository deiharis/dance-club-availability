"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Search,
  BarChart2,
  LogOut,
  FileText,
  GraduationCap,
  Menu,
  X,
  FileBadge,
  CalendarDays,
  Music,
  ArrowUpRight,
  KeyRound,
  UserCog,
  Bell,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

interface SidebarProps {
  userName: string;
  userEmail: string;
  role: string;
  showDanceFloor: boolean; // SuperAdmin, or a member who is in a dance team
}

export default function Sidebar({ userName, userEmail, role, showDanceFloor }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const isSuperAdmin = role === "SUPERADMIN";
  const isAdminOrAbove = role === "ADMIN" || role === "SUPERADMIN";

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Unread count for the Notifications badge; refreshed on every page change.
  useEffect(() => {
    fetch("/api/notifications/unread?section=COMMITTEE", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => setUnread(0));
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  // Grouped navigation: a management console, not a flat list.
  const groups = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: isAdminOrAbove },
        // Committee feed only; Dance Floor updates have their own page and badge.
        { href: "/notifications", label: "Notifications", icon: Bell, show: isAdminOrAbove, badge: unread },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/members", label: "Members", icon: Users, show: isAdminOrAbove },
        { href: "/timetable", label: "Timetable", icon: Calendar, show: isAdminOrAbove },
        { href: "/search", label: "Search", icon: Search, show: isAdminOrAbove },
        { href: "/analytics", label: "Analytics", icon: BarChart2, show: isAdminOrAbove },
      ],
    },
    {
      label: "Work",
      items: [
        { href: "/reports/review", label: "Review reports", icon: FileText, show: isAdminOrAbove },
        { href: "/reports/submit", label: "My reports", icon: FileText, show: true },
      ],
    },
    {
      label: "Super admin",
      items: [
        { href: "/events", label: "Events", icon: CalendarDays, show: isSuperAdmin },
        { href: "/od", label: "OD requests", icon: FileBadge, show: isSuperAdmin },
        { href: "/grades", label: "FFCS grades", icon: GraduationCap, show: isSuperAdmin },
      ],
    },
  ];

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} variant="white" />
          <div className="leading-tight">
            <p className="text-white text-sm font-semibold">Working Committee</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
              Management console
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-zinc-400 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Grouped nav with a left-edge active marker */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {groups.map((group) => {
          const items = group.items.filter((i) => i.show);
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {group.label}
              </p>
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 pl-4 pr-3 py-2 text-sm border-l-2 transition-colors ${
                      active
                        ? "border-violet-400 bg-violet-500/10 text-violet-200 font-medium"
                        : "border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                    {"badge" in item && (item.badge ?? 0) > 0 && (
                      <span className="ml-auto rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-violet-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Switch to the dancer section (own team only, unless SuperAdmin) */}
      {showDanceFloor && (
        <Link
          href="/dance"
          className="mx-3 mb-3 flex items-center justify-between rounded border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Music size={14} />
            Dance Floor
          </span>
          <ArrowUpRight size={14} />
        </Link>
      )}

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-8 h-8 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            <p className="text-zinc-500 text-[11px] truncate">
              {isSuperAdmin ? "Super admin" : "Admin"} · {userEmail}
            </p>
          </div>
          <Link href="/account" title="My details" className="text-zinc-500 hover:text-white p-1.5">
            <UserCog size={15} />
          </Link>
          <Link
            href="/change-password"
            title="Change password"
            className="text-zinc-500 hover:text-white p-1.5"
          >
            <KeyRound size={15} />
          </Link>
          <Link
            href="/api/auth/signout"
            title="Sign out"
            className="text-zinc-500 hover:text-white p-1.5"
          >
            <LogOut size={15} />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0d0c10] border-b border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} variant="white" />
          <span className="text-white font-semibold text-sm">Working Committee</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-white/5 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#0d0c10] border-r border-zinc-800 z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 border-r border-zinc-800 bg-[#0d0c10] fixed h-full z-10">
        <SidebarContent />
      </aside>
    </>
  );
}

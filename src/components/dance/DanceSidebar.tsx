"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  FileText,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

interface DanceSidebarProps {
  userName: string;
  userEmail: string;
  label: string; // e.g. "Dance Lead", "Dancer", "Super Admin"
  canManage: boolean; // Dance Lead or committee
  isCommittee: boolean; // SuperAdmin or Core: gets a link back to the committee dashboard
}

// Only link pages that exist. Add rehearsals, attendance, etc. as they are built.
const navItems = [
  { href: "/dance", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dance/roster", label: "Roster", icon: Users, manageOnly: true },
  { href: "/dance/rehearsals", label: "Rehearsals", icon: CalendarDays },
  { href: "/dance/timetable", label: "Timetable", icon: Calendar },
  { href: "/reports/submit", label: "Reports and OD", icon: FileText },
];

export default function DanceSidebar({
  userName,
  userEmail,
  label,
  canManage,
  isCommittee,
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

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-fuchsia-950 flex items-center justify-between">
        <div>
          <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent font-bold text-lg tracking-tight">
            Dance Floor
          </span>
          <p className="text-purple-300/50 text-xs mt-0.5">Dancer Section</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-purple-300/70 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter((i) => canManage || !("manageOnly" in i)).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-fuchsia-500/15 text-fuchsia-200 font-medium"
                  : "text-purple-200/60 hover:text-white hover:bg-fuchsia-500/10"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-fuchsia-950">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{userName}</p>
          <p className="text-purple-300/50 text-xs truncate">{userEmail}</p>
          <span className="text-fuchsia-400 text-xs font-medium">{label}</span>
        </div>
        {isCommittee && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-purple-200/60 hover:text-white hover:bg-fuchsia-500/10 text-sm transition-colors w-full"
          >
            <ArrowLeft size={16} />
            Committee dashboard
          </Link>
        )}
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-purple-200/60 hover:text-white hover:bg-fuchsia-500/10 text-sm transition-colors w-full"
        >
          <LogOut size={16} />
          Sign out
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#140a1f] border-b border-fuchsia-950 px-4 py-3 flex items-center justify-between">
        <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent font-bold text-base tracking-tight">
          Dance Floor
        </span>
        <button
          onClick={() => setOpen(true)}
          className="text-purple-300/70 hover:text-white p-1.5 rounded-lg hover:bg-fuchsia-500/10 transition-colors"
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

      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#140a1f] border-r border-fuchsia-950 z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>

      <aside className="hidden lg:flex lg:flex-col w-60 border-r border-fuchsia-950 bg-[#140a1f] fixed h-full z-10">
        {content}
      </aside>
    </>
  );
}

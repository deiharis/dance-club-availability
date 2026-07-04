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
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userEmail: string;
  role: string;
}

export default function Sidebar({ userName, userEmail, role }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isSuperAdmin = role === "SUPERADMIN";
  const isAdminOrAbove = role === "ADMIN" || role === "SUPERADMIN";

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: isAdminOrAbove },
    { href: "/members", label: "Members", icon: Users, show: isAdminOrAbove },
    { href: "/timetable", label: "Timetable", icon: Calendar, show: isAdminOrAbove },
    { href: "/search", label: "Search", icon: Search, show: isAdminOrAbove },
    { href: "/analytics", label: "Analytics", icon: BarChart2, show: isAdminOrAbove },
    { href: "/reports/review", label: "Reports", icon: FileText, show: isAdminOrAbove },
    { href: "/reports/submit", label: "My Reports", icon: FileText, show: true },
    { href: "/grades", label: "FFCS Grades", icon: GraduationCap, show: isSuperAdmin },
    { href: "/od", label: "OD Requests", icon: FileBadge, show: isSuperAdmin },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-lg tracking-tight">
            Dance Club
          </span>
          <p className="text-gray-500 text-xs mt-0.5">Availability System</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-white/5 text-white font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{userName}</p>
          <p className="text-gray-500 text-xs truncate">{userEmail}</p>
          {isSuperAdmin && (
            <span className="text-purple-400 text-xs font-medium">
              Super Admin
            </span>
          )}
        </div>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors w-full"
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#1a1d27] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-base tracking-tight">
          Dance Club
        </span>
        <button
          onClick={() => setOpen(true)}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
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
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#1a1d27] border-r border-gray-800 z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 border-r border-gray-800 bg-[#1a1d27] fixed h-full z-10">
        <SidebarContent />
      </aside>
    </>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Search,
  BarChart2,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userEmail: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/timetable", label: "Timetable", icon: Calendar },
  { href: "/search", label: "Search", icon: Search },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 border-r border-gray-800 bg-[#1a1d27] flex flex-col fixed h-full z-10">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-lg tracking-tight">
          Dance Club
        </span>
        <p className="text-gray-500 text-xs mt-0.5">Availability System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
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

      {/* User + Sign Out */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{userName}</p>
          <p className="text-gray-500 text-xs truncate">{userEmail}</p>
        </div>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors w-full"
        >
          <LogOut size={16} />
          Sign out
        </Link>
      </div>

    </aside>
  );
}
import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LogOut, FileText, Bell } from "lucide-react";
import TimetableGrid from "@/components/timetable/TimetableGrid";

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Member";
  if (category === "DANCER") return "Dancer";
  if (category === "FFCS_ONLY") return "FFCS Only";
  return "Member";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-purple-500/20 text-purple-400";
  if (category === "DANCER") return "bg-pink-500/20 text-pink-400";
  if (category === "FFCS_ONLY") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const member = await db.member.findUnique({
    where: {
      userId: (session.user as any).id,
    },
  });

  if (!member) {
    return (
      <div className="min-h-screen bg-[#0d0705] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">
            No member profile found.
          </p>
          <Link
            href="/api/auth/signout"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Sign out
          </Link>
        </div>
      </div>
    );
  }

  const entries = await db.timetableEntry.findMany({
    where: {
      memberId: member.id,
    },
  });

  const notifications = await db.notification.findMany({
    where: {
      memberId: member.id,
      read: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Auto-mark all notifications as read when profile is viewed
  if (notifications.length > 0) {
    await db.notification.updateMany({
      where: {
        memberId: member.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#0d0705] text-white">
      <nav className="border-b border-gray-800 bg-[#17120f] px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-lg tracking-tight">
            Dance Club
          </span>
          <p className="text-gray-500 text-xs mt-0.5">Member Portal</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/reports/submit"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <FileText size={16} />
            My Reports
          </Link>

          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </Link>
        </div>
      </nav>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                  n.type === "REPORT_APPROVED"
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                <Bell
                  size={16}
                  className={
                    n.type === "REPORT_APPROVED"
                      ? "text-green-400 mt-0.5 flex-shrink-0"
                      : "text-red-400 mt-0.5 flex-shrink-0"
                  }
                />

                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      n.type === "REPORT_APPROVED"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {n.message}
                  </p>

                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 text-lg font-semibold">
                {member.fullName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <h1 className="text-white text-xl font-bold">
                {member.fullName}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {member.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-md ${getCategoryStyle(
                  member.category
                )}`}
              >
                {getCategoryLabel(member.category)}
              </span>

              {member.isFFCS && member.category !== "FFCS_ONLY" && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-teal-500/20 text-teal-400">
                  FFCS
                </span>
              )}
            </div>
          </div>

          
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-800">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Register Number
              </p>
              <p className="text-white text-sm font-medium font-mono">
                {member.registerNumber}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Position
              </p>
              <p className="text-white text-sm font-medium">
                {member.position}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Department
              </p>
              <p className="text-white text-sm font-medium">
                {member.department}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                Academic Year
              </p>
              <p className="text-white text-sm font-medium">
                Year {member.academicYear}
              </p>
            </div>
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">My Timetable</h2>
            <Link
              href="/timetable"
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Edit Timetable
            </Link>
          </div>
          <TimetableGrid
            memberId={member.id}
            initialEntries={entries.map((e) => ({
              day: e.day,
              slot: e.slot,
              status: e.status as "FREE" | "CLASS",
            }))}
            readonly
          />
        </div>
      </div>
    </div>
  );
}
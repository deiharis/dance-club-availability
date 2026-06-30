import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LogOut } from "lucide-react";
import TimetableGrid from "@/components/timetable/TimetableGrid";

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Members";
  if (category === "FFCS") return "FFCS";
  return "Normal Members";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-purple-500/20 text-purple-400";
  if (category === "FFCS") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const member = await db.member.findUnique({
    where: { userId: (session.user as any).id },
  });

  if (!member) {
    return (
      <div className="min-h-screen bg-[#0f1117] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">
            No member profile found for your account.
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
    where: { memberId: member.id },
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      {/* Top bar */}
      <nav className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-lg tracking-tight">
            Dance Club
          </span>
          <p className="text-gray-500 text-xs mt-0.5">My Profile</p>
        </div>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </Link>
      </nav>

      <div className="p-8 max-w-4xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-400 text-lg font-semibold">
                {member.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-white text-xl font-bold">{member.fullName}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{member.email}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${getCategoryStyle(member.category)}`}>
              {getCategoryLabel(member.category)}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
            <div>
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

        {/* Timetable Card */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">My Timetable</h2>
            <p className="text-gray-500 text-xs">
              View only — contact your Core Team to make changes
            </p>
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
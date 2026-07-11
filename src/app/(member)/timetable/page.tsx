import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TimetableGrid from "@/components/timetable/TimetableGrid";

export default async function MemberTimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  // Admins and SuperAdmins use the admin timetable pages
  if (role === "ADMIN" || role === "SUPERADMIN") {
    redirect("/timetable");
  }

  const member = await db.member.findUnique({
    where: { userId },
  });

  if (!member) {
    redirect("/profile");
  }

  const entries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">

      <nav className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-base sm:text-lg tracking-tight">
            Dance Club
          </span>
          <p className="text-gray-500 text-xs mt-0.5">My Timetable</p>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Profile</span>
        </Link>
      </nav>

      <div className="p-4 sm:p-8 max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-white">
            My Timetable
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Click any cell to toggle between Free and Class.
          </p>
        </div>

        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-4 sm:p-6">
          <TimetableGrid
            memberId={member.id}
            initialEntries={entries.map((e) => ({
              day: e.day,
              slot: e.slot,
              status: e.status as "FREE" | "CLASS",
            }))}
            readonly={false}
          />
        </div>

      </div>
    </div>
  );
}
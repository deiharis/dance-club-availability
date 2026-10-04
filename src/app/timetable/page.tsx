import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import Sidebar from "@/components/layout/Sidebar";

// ── Member's own editable timetable ──────────────────────
async function MemberTimetableView() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const member = await db.member.findUnique({ where: { userId } });
  if (!member) redirect("/profile");

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

// ── Admin timetable card per member ──────────────────────
async function MemberTimetableCard({
  member,
}: {
  member: {
    id: string;
    fullName: string;
    registerNumber: string;
    department: string;
    position: string | null;
  };
}) {
  const entries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  return (
    <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center">
            <span className="text-purple-400 text-xs font-semibold">
              {member.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{member.fullName}</p>
            <p className="text-gray-500 text-xs">
              {member.registerNumber} · {member.department}
              {member.position ? ` · ${member.position}` : ""}
            </p>
          </div>
        </div>
        <Link
          href={`/timetable/${member.id}`}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Full view
        </Link>
      </div>
      <div className="px-6 py-4">
        <TimetableGrid
          memberId={member.id}
          initialEntries={entries.map((e) => ({
            day: e.day,
            slot: e.slot,
            status: e.status as "FREE" | "CLASS",
          }))}
        />
      </div>
    </div>
  );
}

// ── Main page — roles split here ─────────────────────────
export default async function TimetablePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;

  // Dancers and Dance Leads use the dancer-section timetable
  if ((session.user as any).category === "DANCER") redirect("/dance/timetable");

  // Normal members see their own editable timetable
  if (role === "MEMBER") {
    return <MemberTimetableView />;
  }

  // Admins and SuperAdmins see all members
  const members = await db.member.findMany({
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      <Sidebar
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
        role={role}
      />
      <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        <div className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4">
          <h1 className="text-base sm:text-lg font-semibold text-white">
            Timetable
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Click any cell to toggle between Free and Class
          </p>
        </div>
        <div className="p-4 sm:p-8">
          {members.length === 0 ? (
            <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-500 text-sm mb-4">
                No members yet. Add members first.
              </p>
              <Link
                href="/members/add"
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Add Member
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {members.map((member) => (
                <MemberTimetableCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
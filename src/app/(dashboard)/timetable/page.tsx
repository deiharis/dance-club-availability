import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import TimetableGrid from "@/components/timetable/TimetableGrid";

export default async function TimetablePage() {
  const members = await db.member.findMany({
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4">
        <h1 className="text-lg font-semibold text-white">Timetable</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Click any cell to toggle: Free ↔ Class
        </p>
      </div>

      <div className="p-8 min-w-0">
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
              <MemberTimetable key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function MemberTimetable({
  member,
}: {
  member: {
    id: string;
    fullName: string;
    registerNumber: string;
    department: string;
    position: string;
    category: string;
  };
}) {
  const entries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  return (
    <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">
      {/* Member Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center">
            <span className="text-purple-400 text-xs font-semibold">
              {member.fullName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <p className="text-white text-sm font-medium">
              {member.fullName}
            </p>

            <p className="text-gray-500 text-xs">
              {member.registerNumber} · {member.department} ·{" "}
              {member.position}
            </p>
          </div>
        </div>

        <Link
          href={`/timetable/${member.id}`}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Full View
        </Link>
      </div>

      {/* Timetable */}
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
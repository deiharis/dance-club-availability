import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import TimetableGrid from "@/components/timetable/TimetableGrid";

export default async function MemberTimetablePage({
  params,
}: {
  params: { memberId: string };
}) {
  const member = await db.member.findUnique({
    where: { id: params.memberId },
  });

  if (!member) {
    notFound();
  }

  const entries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  return (
    <div>
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">
            {member.fullName}
          </h1>

          <p className="text-gray-500 text-xs mt-0.5">
            {member.registerNumber} · {member.department} · {member.position}
          </p>
        </div>

        <Link
          href="/timetable"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back to Timetable
        </Link>
      </div>

      {/* Timetable */}
      <div className="p-8">
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl px-6 py-6">
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
    </div>
  );
}
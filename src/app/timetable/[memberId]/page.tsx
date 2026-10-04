import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import Sidebar from "@/components/layout/Sidebar";

export default async function MemberTimetablePage({
  params,
}: {
  params: { memberId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;

  // Members can only view their own individual timetable
  if (role === "MEMBER") {
    redirect("/timetable");
  }

  // Dance Leads use the dancer section instead of the committee view
  if ((session.user as any).category === "DANCER") redirect("/dance/timetable");

  const member = await db.member.findUnique({
    where: { id: params.memberId },
  });

  if (!member) notFound();

  const entries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      <Sidebar
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
        role={role}
      />
      <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        <div className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-white">
              {member.fullName}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {member.registerNumber} · {member.department}
              {member.position ? ` · ${member.position}` : ""}
            </p>
          </div>
          <Link
            href="/timetable"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Timetable
          </Link>
        </div>

        <div className="p-4 sm:p-8 min-w-0">
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl px-4 sm:px-6 py-6">
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
      </main>
    </div>
  );
}
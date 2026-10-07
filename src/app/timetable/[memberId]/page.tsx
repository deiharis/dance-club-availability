import React from "react";
import { consoleFont } from "@/lib/fonts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import Sidebar from "@/components/layout/Sidebar";
import { getCaller } from "@/lib/dance";

export default async function MemberTimetablePage({
  params,
}: {
  params: { memberId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;

  // Committee only, checked against the database (not the possibly stale login token).
  // Dance Leads use the dancer section; members can only see their own timetable.
  const caller = await getCaller();
  if (caller?.member?.category === "DANCER") redirect("/dance/timetable");
  if (!caller?.isCommittee) redirect("/timetable");

  const member = await db.member.findUnique({
    where: { id: params.memberId },
  });

  if (!member) notFound();

  const entries = await db.timetableEntry.findMany({ where: { memberId: member.id } });

  return (
    <div className={`${consoleFont.className} committee-ui min-h-screen bg-base text-white flex`}>
      <Sidebar
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
        role={role}
        showDanceFloor={caller.seesAllTeams || caller.inTeam}
      />
      <main className="page-enter flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        <div data-section="People" className="c-page-header flex items-center justify-between">
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
            className="press flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            All timetables
          </Link>
        </div>

        <div className="p-4 sm:p-8 min-w-0">
          <div className="bg-surface border border-gray-800 rounded-xl px-4 sm:px-6 py-6">
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
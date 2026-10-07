import React from "react";
import { consoleFont } from "@/lib/fonts";
import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import Sidebar from "@/components/layout/Sidebar";
import { getCaller } from "@/lib/dance";
import { NO_TIMETABLE } from "@/lib/timetable";
import MemberShell, { MemberHeading } from "@/components/member/MemberShell";
import TimetableDirectory from "@/components/timetable/TimetableDirectory";

// ── Member's own editable timetable ──────────────────────
async function MemberTimetableView() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const member = await db.member.findUnique({ where: { userId } });
  if (!member) redirect("/profile");

  const entries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  return (
    <MemberShell name={member.fullName} inTeam={!!member.team}>
      <MemberHeading
        label="Availability"
        title="My timetable"
        subtitle="Click any cell to switch it between Free and Class. Your Core Team uses this to plan around you."
      />
      <div className="rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-4 sm:p-6">
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
    </MemberShell>
  );
}

// ── Main page — roles split here ─────────────────────────
export default async function TimetablePage({
  searchParams,
}: {
  searchParams: { missing?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;

  // Checked against the database, not the (possibly stale) login token.
  const caller = await getCaller();
  // Dancers and Dance Leads use the dancer-section timetable
  if (caller?.member?.category === "DANCER") redirect("/dance/timetable");

  // Normal members see their own editable timetable; only the committee sees everyone's
  if (!caller?.isCommittee) {
    return <MemberTimetableView />;
  }

  // Admins and SuperAdmins see all members, or (?missing=1, from the dashboard tile) only the
  // members who have not filled in their timetable (NO_TIMETABLE in lib/timetable.ts: no Class
  // slot saved; someone genuinely free all week also shows here).
  const missing = searchParams.missing === "1";
  const noTimetable = NO_TIMETABLE;
  const [members, missingCount] = await Promise.all([
    db.member.findMany({
      where: missing ? noTimetable : undefined,
      orderBy: { fullName: "asc" },
      // Everyone's class slots in the same trip (2 queries total, not one per member). Only CLASS
      // rows are sent to the browser: a missing slot already means free.
      select: {
        id: true, fullName: true, registerNumber: true, department: true, position: true, team: true, category: true,
        timetableEntries: { where: { status: "CLASS" }, select: { day: true, slot: true } },
      },
    }),
    db.member.count({ where: noTimetable }),
  ]);
  const tab = (on: boolean) =>
    `rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
      on
        ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
        : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
    }`;

  return (
    <div className={`${consoleFont.className} committee-ui min-h-screen bg-base text-white flex`}>
      <Sidebar
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
        role={role}
        showDanceFloor={caller.seesAllTeams || caller.inTeam}
      />
      <main className="page-enter flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        <div data-section="People" className="c-page-header">
          <h1 className="text-base sm:text-lg font-semibold text-white">
            Timetable
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {missing
              ? "Members who have not set their timetable yet. Fill it in here, or ask them to."
              : "Find a member and open their week to view or edit it"}
          </p>
        </div>
        <div className="p-4 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/timetable" className={tab(!missing)}>
              All members
            </Link>
            <Link href="/timetable?missing=1" className={tab(missing)}>
              No timetable ({missingCount})
            </Link>
            {/* Name + register number of the same "No timetable" list, as Excel (read-only) */}
            {missingCount > 0 && (
              <a
                href="/api/timetable/missing/export"
                download
                className="ml-auto flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-white/5"
              >
                <Download size={13} />
                Export no-timetable list ({missingCount})
              </a>
            )}
          </div>
          <TimetableDirectory
            missing={missing}
            members={members.map(({ timetableEntries, ...m }) => ({ ...m, classes: timetableEntries.map((e) => `${e.day}_${e.slot}`) }))}
          />
        </div>
      </main>
    </div>
  );
}
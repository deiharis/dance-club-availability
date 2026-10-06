import React from "react";
import { consoleFont } from "@/lib/fonts";
import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import Sidebar from "@/components/layout/Sidebar";
import { getCaller } from "@/lib/dance";
import { NO_TIMETABLE } from "@/lib/timetable";
import MemberShell, { MemberHeading } from "@/components/member/MemberShell";

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

// ── Admin timetable card per member ──────────────────────
// Gets its entries from the page (loaded for everyone in ONE query). It used to query the database
// itself, once per member: with ~300 members that was ~300 queries at once, which ran out of
// database connections on Vercel and crashed the page.
function MemberTimetableCard({
  member,
}: {
  member: {
    id: string;
    fullName: string;
    registerNumber: string;
    department: string;
    position: string | null;
    timetableEntries: { day: string; slot: string; status: string }[];
  };
}) {
  const entries = member.timetableEntries;

  return (
    <div className="bg-[#111014] border border-gray-800 rounded-xl overflow-hidden">
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
      // Everyone's timetable in the same trip (2 queries total, not one per member).
      include: { timetableEntries: { select: { day: true, slot: true, status: true } } },
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
      <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        <div data-section="People" className="c-page-header">
          <h1 className="text-base sm:text-lg font-semibold text-white">
            Timetable
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {missing
              ? "Members who have not set their timetable yet. Fill it in here, or ask them to."
              : "Click any cell to toggle between Free and Class"}
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
          </div>
          {missing && members.length === 0 ? (
            <div className="bg-[#111014] border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">Everyone has set their timetable.</p>
            </div>
          ) : members.length === 0 ? (
            <div className="bg-[#111014] border border-gray-800 rounded-xl p-12 text-center">
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
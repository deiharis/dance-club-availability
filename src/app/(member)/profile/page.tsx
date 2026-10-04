import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CheckCircle, XCircle, Bell, ArrowUpRight } from "lucide-react";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import MemberShell, { MemberHeading } from "@/components/member/MemberShell";

const CATEGORY: Record<string, { label: string; chip: string }> = {
  CORE: { label: "Core member", chip: "bg-violet-500/15 text-violet-300" },
  DANCER: { label: "Dancer", chip: "bg-pink-500/15 text-pink-300" },
  FFCS_ONLY: { label: "FFCS only", chip: "bg-teal-500/15 text-teal-300" },
  MEMBER: { label: "Normal member", chip: "bg-zinc-500/20 text-zinc-300" },
};

const panel = "rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const member = await db.member.findUnique({
    where: { userId: session.user.id },
  });

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base text-white">
        <div className="text-center">
          <p className="mb-4 text-sm text-zinc-400">No member profile found.</p>
          <Link href="/api/auth/signout" className="text-sm text-violet-300 hover:text-violet-200">
            Sign out
          </Link>
        </div>
      </div>
    );
  }

  const [entries, notifications] = await Promise.all([
    db.timetableEntry.findMany({ where: { memberId: member.id } }),
    // The latest few, so a notification does not disappear after one visit.
    db.notification.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  // Opening the profile marks everything as read. The ones that were unread are still
  // highlighted below because `notifications` was fetched first.
  if (notifications.some((n) => !n.read)) {
    await db.notification.updateMany({
      where: { memberId: member.id, read: false },
      data: { read: true },
    });
  }

  const cat = CATEGORY[member.category] ?? CATEGORY.MEMBER;
  const firstName = member.fullName.split(" ")[0];
  const details = [
    { label: "Register number", value: member.registerNumber, mono: true },
    { label: member.category === "DANCER" ? "Role" : "Position", value: member.position ?? "Not set" },
    ...(member.team ? [{ label: "Team", value: member.team }] : []),
    { label: "Department", value: member.department },
    { label: "Academic year", value: `Year ${member.academicYear}` },
  ];

  return (
    <MemberShell name={member.fullName} inTeam={!!member.team}>
      <MemberHeading label="Member portal" title={`Welcome, ${firstName}`} subtitle="Your details, updates and weekly timetable." />

      <div className="space-y-6">
        {/* Profile card */}
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-600/25 text-xl font-bold text-violet-200">
              {member.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-white">{member.fullName}</h2>
              <p className="truncate text-sm text-zinc-500">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded px-2.5 py-1 text-xs font-semibold ${cat.chip}`}>{cat.label}</span>
              {member.isFFCS && member.category !== "FFCS_ONLY" && (
                <span className="rounded bg-teal-500/15 px-2.5 py-1 text-xs font-semibold text-teal-300">FFCS</span>
              )}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 md:grid-cols-4">
            {details.map((d) => (
              <div key={d.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{d.label}</dt>
                <dd className={`mt-1 text-sm font-medium text-white ${d.mono ? "font-mono" : ""}`}>{d.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Updates */}
        <section className={`${panel} overflow-hidden`}>
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">Updates</h2>
            <Link href="/reports/submit" className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">
              My reports <ArrowUpRight size={12} />
            </Link>
          </header>
          {notifications.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-zinc-500">
              <Bell size={16} className="text-zinc-600" />
              Nothing yet. Decisions on your reports will show up here.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {notifications.map((n) => {
                const approved = n.type === "REPORT_APPROVED";
                const Icon = approved ? CheckCircle : n.type === "REPORT_REJECTED" ? XCircle : Bell;
                const color = approved ? "text-emerald-400" : n.type === "REPORT_REJECTED" ? "text-red-400" : "text-violet-300";
                return (
                  <li key={n.id} className={`flex items-start gap-3 px-5 py-3 ${n.read ? "" : "bg-violet-500/[0.06]"}`}>
                    <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.read ? "text-zinc-300" : "font-medium text-white"}`}>{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Timetable */}
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">My timetable</h2>
            <Link href="/timetable" className="text-xs font-semibold text-violet-300 hover:text-violet-200">
              Edit timetable
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
        </section>
      </div>
    </MemberShell>
  );
}

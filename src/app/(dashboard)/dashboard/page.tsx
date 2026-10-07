import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCaller, leadReviewedWhere } from "@/lib/dance";
import { NO_TIMETABLE } from "@/lib/timetable";
import { listProgrammeIssues } from "@/lib/programme-issues";
import HaloParallax from "@/components/console/HaloParallax";
import { CountUp } from "@/components/analytics/parts";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import { onboardingSteps } from "@/lib/onboarding";
import {
  FileText,
  FileBadge,
  CalendarX2,
  GraduationCap,
  UserPlus,
  Upload,
  Search,
  BarChart2,
  Music,
  CalendarDays,
  CalendarClock,
  Star,
  ArrowRight,
  CheckCircle2,
  Download,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = { CORE: "Core", MEMBER: "Normal", DANCER: "Dancer", FFCS_ONLY: "FFCS only" };

// Working Committee home: what is happening, what needs me, what should I do next.
// Dance-team data follows the usual rules: every team for the SuperAdmin / Advisory, only your
// own team for a Core member who dances, none otherwise.
export default async function DashboardPage() {
  const caller = await getCaller();
  if (!caller) redirect("/login");
  const isSuper = caller.isSuper;
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00Z");
  const teamFilter = caller.seesAllTeams ? {} : caller.member?.team ? { team: caller.member.team } : null;

  const [byCategory, ffcs, pendingReports, pendingOD, noTimetable, events, rehearsals, performances, recent, programmeIssues, myClasses] =
    await Promise.all([
      db.member.groupBy({ by: ["category"], _count: true }),
      db.member.count({ where: { isFFCS: true } }),
      // Same queue the committee sees: dance-topic reports go to the team's Lead instead.
      db.report.count({ where: { status: "PENDING", NOT: leadReviewedWhere } }),
      isSuper ? db.oDRequest.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      db.member.count({ where: NO_TIMETABLE }),
      db.event.findMany({ where: { eventDate: { gte: today } }, orderBy: { eventDate: "asc" }, take: 5 }),
      teamFilter
        ? db.rehearsal.findMany({ where: { ...teamFilter, date: { gte: today }, cancelledAt: null }, orderBy: [{ date: "asc" }, { startTime: "asc" }], take: 5 })
        : Promise.resolve([]),
      teamFilter
        ? db.performance.findMany({ where: { ...teamFilter, eventDate: { gte: today }, cancelledAt: null }, orderBy: { eventDate: "asc" }, take: 5 })
        : Promise.resolve([]),
      db.member.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, fullName: true, category: true, team: true, position: true } }),
      isSuper ? listProgrammeIssues().then((l) => l.length) : Promise.resolve(0),
      // Your own timetable, for the "Finish setting up" checklist
      caller.member ? db.timetableEntry.count({ where: { memberId: caller.member.id, status: "CLASS" } }) : Promise.resolve(1),
    ]);

  const countOf = (key: string) => byCategory.find((c) => c.category === key)?._count ?? 0;
  const total = byCategory.reduce((sum, c) => sum + c._count, 0);
  const completion = total === 0 ? 0 : Math.round(((total - noTimetable) / total) * 100);

  // ── Needs attention ─────────────────────────────────────────────────────────
  const attention = [
    { show: true, count: pendingReports, icon: FileText, title: "Reports to review", text: "Work reports waiting for a committee decision.", href: "/reports/review", cta: "Review reports" },
    { show: isSuper, count: pendingOD, icon: FileBadge, title: "OD requests", text: "Approve once the college has granted the OD.", href: "/od", cta: "Open OD requests" },
    { show: true, count: noTimetable, icon: CalendarX2, title: "No timetable yet", text: "Members who have not filled in their timetable.", href: "/timetable?missing=1", cta: "See who", extra: { href: "/api/timetable/missing/export", label: "Export list" } },
    { show: isSuper, count: programmeIssues, icon: GraduationCap, title: "Programme to fix", text: "Members whose course could not be matched. They have been asked to fix it.", href: "/members", cta: "View on Members" },
  ].filter((a) => a.show);
  const waiting = attention.filter((a) => a.count > 0);

  // ── Hero status line ────────────────────────────────────────────────────────
  const hour = Number(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (caller.member?.fullName ?? "there").split(" ")[0];
  const decisions = [
    pendingReports > 0 && `${pendingReports} report${pendingReports === 1 ? "" : "s"}`,
    pendingOD > 0 && `${pendingOD} OD request${pendingOD === 1 ? "" : "s"}`,
  ].filter(Boolean) as string[];
  const status =
    decisions.length > 0
      ? `${decisions.join(" and ")} ${decisions.length === 1 && !decisions[0].endsWith("s") ? "is" : "are"} waiting on you.`
      : noTimetable > 0
      ? `Nothing is waiting on a decision. ${noTimetable} member${noTimetable === 1 ? " still needs" : "s still need"} to fill in a timetable.`
      : "You are all caught up. Nothing needs a decision right now.";
  const primary =
    pendingReports > 0
      ? { href: "/reports/review", label: "Review reports", icon: FileText }
      : pendingOD > 0
      ? { href: "/od", label: "Open OD requests", icon: FileBadge }
      : { href: "/members/add", label: "Add a member", icon: UserPlus };

  // ── Upcoming (merged and sorted by date) ─────────────────────────────────────
  const upcoming = [
    ...events.map((e) => ({ key: `e${e.id}`, date: e.eventDate, kind: "Event", title: e.name, meta: "Members can request OD for this", icon: CalendarDays, href: isSuper ? "/events" : undefined })),
    ...rehearsals.map((r) => ({ key: `r${r.id}`, date: r.date, kind: "Rehearsal", title: r.title, meta: `${r.team} · ${r.startTime} - ${r.endTime}${r.venue ? ` · ${r.venue}` : ""}`, icon: CalendarClock, href: `/dance/rehearsals?team=${encodeURIComponent(r.team)}` })),
    ...performances.map((p) => ({ key: `p${p.id}`, date: p.eventDate, kind: "Performance", title: p.name, meta: `${p.team}${p.venue ? ` · ${p.venue}` : ""}`, icon: Star, href: `/dance/performances?team=${encodeURIComponent(p.team)}` })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  const quick = [
    { href: "/members/add", label: "Add a member", icon: UserPlus, show: true },
    { href: "/members", label: "Import members", icon: Upload, show: true },
    { href: "/search", label: "Find free members", icon: Search, show: true },
    { href: "/analytics", label: "Analytics", icon: BarChart2, show: true },
    { href: "/events", label: "Create an event", icon: CalendarDays, show: isSuper },
    { href: "/dance", label: "Dance Floor", icon: Music, show: caller.seesAllTeams || caller.inTeam },
  ].filter((q) => q.show);

  return (
    <div>
      <div data-section="Overview" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      </div>

      {/* Hero: greeting + live status on the eclipse */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 text-center sm:pt-24">
        <HaloParallax>
          <div className="halo-atmos" />
          <div className="halo-rays" />
          <div className="halo-planet" />
        </HaloParallax>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/70 to-transparent" aria-hidden="true" />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">Working Committee</p>
        <h2 className="relative mx-auto mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
          {greeting}, {firstName}.
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-sm text-zinc-300 sm:text-base">{status}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={primary.href}
            className="press inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_-6px_rgba(124,58,237,0.9)] hover:bg-violet-500"
          >
            <primary.icon size={15} aria-hidden="true" />
            {primary.label}
          </Link>
          <Link href="/search" className="press rounded-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            Find free members
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pb-20 sm:px-8">
        {/* At a glance */}
        <div className="-mt-10 grid grid-cols-2 overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur lg:grid-cols-4">
          {[
            { label: "Members", value: total, href: "/members" },
            { label: "Dancers", value: countOf("DANCER"), href: "/members" },
            { label: "FFCS enrolled", value: ffcs, href: "/grades" },
          ].map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className={`press px-6 py-5 hover:bg-white/[0.03] ${i % 2 === 1 ? "border-l border-white/15" : ""} ${i === 2 ? "border-t border-white/15 lg:border-t-0 lg:border-l" : ""}`}
            >
              <p className="text-3xl font-bold tabular-nums text-white"><CountUp value={s.value} /></p>
              <p className="mt-1 text-xs text-zinc-400">{s.label}</p>
            </Link>
          ))}
          <Link href="/timetable?missing=1" className="press border-l border-t border-white/15 px-6 py-5 hover:bg-white/[0.03] lg:border-t-0">
            <p className="text-3xl font-bold tabular-nums text-white"><CountUp value={completion} suffix="%" /></p>
            <p className="mt-1 text-xs text-zinc-400">Timetables filled in</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300" style={{ width: `${completion}%` }} />
            </div>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-10">
            {/* Needs attention */}
            <section aria-labelledby="attention-h">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id="attention-h" className="text-lg font-bold text-white">Needs attention</h2>
                <p className="text-xs text-zinc-500">{waiting.length === 0 ? "All clear" : `${waiting.length} of ${attention.length} need you`}</p>
              </div>
              {waiting.length === 0 ? (
                <div className="flex items-center gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                  <CheckCircle2 size={22} className="shrink-0 text-emerald-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-white">You are all caught up</p>
                    <p className="text-xs text-zinc-400">No reports, OD requests, missing timetables or programme fixes are waiting.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {attention.map((a) => {
                    const Icon = a.icon;
                    const on = a.count > 0;
                    return (
                      <div
                        key={a.title}
                        className={`group relative flex flex-col rounded-xl border p-5 transition-colors duration-200 ${
                          on ? "border-violet-400/30 bg-gradient-to-b from-violet-500/[0.08] to-transparent hover:border-violet-400/60" : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-md ${on ? "bg-violet-500/20 text-violet-200" : "bg-white/5 text-zinc-500"}`}>
                            <Icon size={17} aria-hidden="true" />
                          </span>
                          <p className={`text-3xl font-bold tabular-nums ${on ? "text-white" : "text-zinc-600"}`}>{a.count}</p>
                        </div>
                        <p className={`mt-4 text-sm font-semibold ${on ? "text-white" : "text-zinc-400"}`}>{a.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{on ? a.text : "Nothing waiting."}</p>
                        {on && (
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Link href={a.href} className="press inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500">
                              {a.cta} <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                            {"extra" in a && a.extra && (
                              <a href={a.extra.href} download className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white">
                                <Download size={13} aria-hidden="true" /> {a.extra.label}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Upcoming */}
            <section aria-labelledby="upcoming-h">
              <h2 id="upcoming-h" className="mb-4 text-lg font-bold text-white">Upcoming</h2>
              {upcoming.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center">
                  <CalendarDays size={20} className="mx-auto text-zinc-600" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-zinc-300">Nothing scheduled yet</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {isSuper ? "Create an event so members can request OD for it." : "New events, rehearsals and performances will appear here."}
                  </p>
                  {isSuper && (
                    <Link href="/events" className="press mt-4 inline-block rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/5">
                      Create an event
                    </Link>
                  )}
                </div>
              ) : (
                <ol className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-surface">
                  {upcoming.map((u) => {
                    const Icon = u.icon;
                    const body = (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <div className="flex w-12 shrink-0 flex-col items-center rounded-md border border-white/10 py-1">
                          <span className="text-[10px] font-semibold uppercase text-violet-300">{u.date.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}</span>
                          <span className="text-lg font-bold leading-none text-white">{u.date.getUTCDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            <Icon size={12} aria-hidden="true" /> {u.kind}
                            {u.date.getTime() === today.getTime() && <span className="rounded bg-violet-500/20 px-1.5 py-px text-violet-200">Today</span>}
                          </p>
                          <p className="truncate text-sm font-medium text-white">{u.title}</p>
                          <p className="truncate text-xs text-zinc-500">{u.meta}</p>
                        </div>
                        {u.href && <ArrowRight size={14} className="shrink-0 text-zinc-600" aria-hidden="true" />}
                      </div>
                    );
                    return (
                      <li key={u.key}>
                        {u.href ? <Link href={u.href} className="block transition-colors duration-200 hover:bg-white/[0.03]">{body}</Link> : body}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>

          {/* Side column */}
          <aside className="space-y-10">
            {caller.member && <OnboardingChecklist steps={onboardingSteps(caller.member, myClasses > 0)} />}
            <section aria-labelledby="quick-h">
              <h2 id="quick-h" className="mb-4 text-lg font-bold text-white">Quick actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {quick.map((q) => (
                  <Link
                    key={q.href + q.label}
                    href={q.href}
                    className="press flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-sm font-medium text-zinc-200 hover:border-violet-400/40 hover:bg-violet-500/[0.06] hover:text-white"
                  >
                    <q.icon size={17} className="text-violet-300" aria-hidden="true" />
                    {q.label}
                  </Link>
                ))}
              </div>
            </section>

            <section aria-labelledby="newest-h">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id="newest-h" className="text-lg font-bold text-white">Newest members</h2>
                <Link href="/members" className="text-xs font-medium text-violet-300 hover:text-violet-200">View all</Link>
              </div>
              {recent.length === 0 ? (
                <p className="rounded-xl border border-white/10 p-5 text-sm text-zinc-500">No members yet. Add or import members to get started.</p>
              ) : (
                <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-surface">
                  {recent.map((m) => (
                    <li key={m.id}>
                      <Link href={`/members/${m.id}/edit`} className="flex items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-white/[0.03]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-zinc-300">
                          {m.fullName.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{m.fullName}</span>
                          <span className="block truncate text-xs text-zinc-500">
                            {CATEGORY_LABEL[m.category] ?? "Member"}
                            {m.position ? ` · ${m.position}` : ""}
                            {m.team ? ` · ${m.team}` : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

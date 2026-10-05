import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { leadReviewedWhere } from "@/lib/dance";
import {
  Users,
  Calendar,
  Search,
  BarChart2,
  FileText,
  FileBadge,
  CalendarDays,
  UserPlus,
  ArrowUpRight,
  Music,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  CORE: "Core",
  MEMBER: "Normal",
  DANCER: "Dancer",
  FFCS_ONLY: "FFCS only",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isSuper = session?.user?.role === "SUPERADMIN";
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

  const [byCategory, ffcs, pendingReports, pendingOD, noTimetable, events, recent] =
    await Promise.all([
      db.member.groupBy({ by: ["category"], _count: true }),
      db.member.count({ where: { isFFCS: true } }),
      // Same queue the committee sees: dance-topic reports go to the team's Lead instead.
      db.report.count({ where: { status: "PENDING", NOT: leadReviewedWhere } }),
      isSuper ? db.oDRequest.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      db.member.count({ where: { timetableEntries: { none: {} } } }),
      db.event.findMany({
        where: { eventDate: { gte: today } },
        orderBy: { eventDate: "asc" },
        take: 4,
      }),
      db.member.findMany({ take: 3, orderBy: { createdAt: "desc" } }),
    ]);

  const countOf = (key: string) => byCategory.find((c) => c.category === key)?._count ?? 0;
  const total = byCategory.reduce((sum, c) => sum + c._count, 0);

  // Quick-link cards. The first one is shown highlighted, like the reference.
  const cards = [
    { href: "/members", icon: Users, title: "Members", text: "Add, edit and import everyone in the club." },
    { href: "/timetable", icon: Calendar, title: "Timetables", text: "See who is in class and who is free." },
    { href: "/search", icon: Search, title: "Find free members", text: "Pick slots and find everyone available." },
    { href: "/analytics", icon: BarChart2, title: "Analytics", text: "Heatmap, best slots and per-member availability." },
    { href: "/reports/review", icon: FileText, title: "Review reports", text: "Approve or reject work reports." },
    isSuper
      ? { href: "/events", icon: CalendarDays, title: "Events", text: "Create events members choose for OD." }
      : { href: "/dance", icon: Music, title: "Dance Floor", text: "Teams, rehearsals and performances." },
  ];

  // Numbered tiles in the violet band.
  const tiles = [
    { n: "01", value: pendingReports, label: "Reports to review", href: "/reports/review" },
    isSuper
      ? { n: "02", value: pendingOD, label: "OD requests to approve", href: "/od" }
      : { n: "02", value: total, label: "Members in the club", href: "/members" },
    { n: "03", value: noTimetable, label: "Members with no timetable", href: "/timetable?missing=1" },
    { n: "04", value: events.length, label: events[0] ? `Next: ${events[0].name}` : "Upcoming events", href: isSuper ? "/events" : "/dashboard" },
  ];

  return (
    <div>
      <div data-section="Overview" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Dashboard</h1>
          <p className="text-zinc-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Hero with the halo arch */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 text-center sm:pt-24">
        <div className="console-halo" aria-hidden="true" />
        <p className="relative mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
          Run the committee.
          <br />
          Keep the club in sync.
        </p>
        <p className="relative mx-auto mt-5 max-w-xl text-sm text-zinc-300 sm:text-base">
          Members, timetables, reports and events in one console, so the whole team always knows who is free and what needs a decision.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/members/add"
            className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_-6px_rgba(124,58,237,0.9)] transition hover:bg-violet-500"
          >
            <UserPlus size={15} />
            Add a member
          </Link>
          <Link
            href="/search"
            className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Find free members
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-20 px-4 pb-20 sm:px-8">
        {/* Bar of key numbers */}
        <div className="-mt-10 grid grid-cols-2 overflow-hidden rounded-xl border border-white/15 bg-black/50 backdrop-blur sm:grid-cols-4">
          {[
            { label: "Total members", value: total },
            { label: "Core team", value: countOf("CORE") },
            { label: "Dancers", value: countOf("DANCER") },
            { label: "FFCS enrolled", value: ffcs },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`px-6 py-5 ${i > 0 ? "sm:border-l sm:border-white/15" : ""} ${i % 2 === 1 ? "border-l border-white/15 sm:border-l" : ""} ${i > 1 ? "border-t border-white/15 sm:border-t-0" : ""}`}
            >
              <p className="text-3xl font-bold tabular-nums text-white">{s.value}</p>
              <p className="mt-1 text-xs text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick-link cards */}
        <section>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Everything. <span className="text-violet-400">In one place.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-400">
            Jump straight to what you need to manage today.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c, i) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className={`group relative rounded-xl border p-5 transition ${
                    i === 0
                      ? "border-violet-400/40 bg-gradient-to-br from-violet-600 to-violet-800"
                      : "border-white/15 bg-gradient-to-b from-white/[0.05] to-transparent hover:border-violet-400/50 hover:from-violet-600/30 hover:to-violet-900/20"
                  }`}
                >
                  <ArrowUpRight
                    size={16}
                    className="absolute right-4 top-4 text-white/60 transition group-hover:text-white"
                  />
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-violet-300/30 bg-violet-500/20 text-violet-200">
                    <Icon size={17} />
                  </span>
                  <p className="mt-6 text-sm font-bold text-white">{c.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">{c.text}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* Full-width violet band with numbered tiles */}
      <section className="bg-gradient-to-b from-violet-950 via-[#1c0d52] to-violet-950 px-4 py-16 sm:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Needs your attention
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm text-violet-200/70">
          What is waiting on the committee right now.
        </p>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link
              key={t.n}
              href={t.href}
              className="group relative flex min-h-[9rem] flex-col justify-between rounded-xl border border-white/20 bg-white/[0.03] p-5 transition hover:bg-white/10"
            >
              <ArrowUpRight
                size={15}
                className="absolute right-4 top-4 text-white/50 transition group-hover:text-white"
              />
              <span className="text-xs font-semibold tracking-widest text-violet-300">{t.n}</span>
              <div>
                <p className="text-4xl font-bold tabular-nums text-white">{t.value}</p>
                <p className="mt-1 truncate text-sm text-violet-100/80">{t.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        <section>
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Newest <span className="text-violet-400">members.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-zinc-400">
            The latest people to join the club.
          </p>
          {recent.length === 0 ? (
            <p className="mt-10 text-center text-sm text-zinc-500">No members yet.</p>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {recent.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.05] to-transparent p-5"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">
                    {CATEGORY_LABEL[m.category] ?? "Member"}
                  </p>
                  <p className="mt-3 text-sm font-bold text-white">{m.fullName}</p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-500">{m.registerNumber}</p>
                  <p className="mt-3 text-xs text-zinc-400">
                    {m.department}
                    {m.position ? ` · ${m.position}` : m.team ? ` · ${m.team}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link
              href="/members"
              className="inline-block rounded-md bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              View all members
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

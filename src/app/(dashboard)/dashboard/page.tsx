import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Users,
  Calendar,
  CalendarDays,
  Search,
  BarChart2,
  FileText,
  FileBadge,
  UserPlus,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

const CATEGORIES = [
  { key: "CORE", label: "Core", bar: "bg-sky-400", chip: "bg-sky-500/15 text-sky-300" },
  { key: "MEMBER", label: "Normal", bar: "bg-stone-400", chip: "bg-stone-500/20 text-stone-300" },
  { key: "DANCER", label: "Dancer", bar: "bg-pink-400", chip: "bg-pink-500/15 text-pink-300" },
  { key: "FFCS_ONLY", label: "FFCS only", bar: "bg-teal-400", chip: "bg-teal-500/15 text-teal-300" },
] as const;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isSuper = (session?.user as any)?.role === "SUPERADMIN";
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

  const [byCategory, ffcs, pendingReports, pendingOD, noTimetable, events, recent] =
    await Promise.all([
      db.member.groupBy({ by: ["category"], _count: true }),
      db.member.count({ where: { isFFCS: true } }),
      // Same queue the committee sees: normal dancers' reports go to their Lead.
      db.report.count({
        where: {
          status: "PENDING",
          NOT: { member: { category: "DANCER", position: { not: "Team Leader" } } },
        },
      }),
      isSuper ? db.oDRequest.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      db.member.count({ where: { timetableEntries: { none: {} } } }),
      db.event.findMany({
        where: { eventDate: { gte: today } },
        orderBy: { eventDate: "asc" },
        take: 4,
      }),
      db.member.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
    ]);

  const countOf = (key: string) => byCategory.find((c) => c.category === key)?._count ?? 0;
  const total = byCategory.reduce((sum, c) => sum + c._count, 0);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div data-section="Overview" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Dashboard</h1>
          <p className="text-stone-500 mt-0.5">{todayLabel}</p>
        </div>
        <Link
          href="/members/add"
          className="flex items-center gap-2 rounded-md bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-sm font-medium text-stone-950 transition-colors"
        >
          <UserPlus size={15} />
          <span className="hidden sm:inline">Add member</span>
        </Link>
      </div>

      <div className="p-4 sm:p-8 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Kpi label="Total members" value={total} hint={`${ffcs} enrolled in FFCS`} href="/members" />
          <Kpi
            label="Reports to review"
            value={pendingReports}
            hint={pendingReports === 0 ? "Nothing waiting" : "Awaiting a decision"}
            href="/reports/review"
            warn={pendingReports > 0}
          />
          <Kpi
            label="No timetable yet"
            value={noTimetable}
            hint="Members with no entries"
            href="/timetable"
            warn={noTimetable > 0}
          />
          <Kpi
            label="Upcoming events"
            value={events.length}
            hint={events[0] ? `Next: ${events[0].name}` : "None scheduled"}
            href={isSuper ? "/events" : undefined}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <Panel title="Membership by category" action={{ href: "/members", label: "All members" }}>
              <div className="p-4 sm:p-5">
                <div className="flex h-2.5 w-full overflow-hidden rounded-sm bg-stone-800">
                  {CATEGORIES.map((c) => {
                    const n = countOf(c.key);
                    return n > 0 ? (
                      <div key={c.key} className={c.bar} style={{ width: `${(n / total) * 100}%` }} />
                    ) : null;
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {CATEGORIES.map((c) => {
                    const n = countOf(c.key);
                    return (
                      <div key={c.key}>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <span className={`h-2 w-2 rounded-sm ${c.bar}`} />
                          {c.label}
                        </div>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-white">{n}</p>
                        <p className="text-[11px] text-stone-500 tabular-nums">
                          {total ? Math.round((n / total) * 100) : 0}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            <Panel title="Recently added" action={{ href: "/members", label: "View all" }}>
              {recent.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-stone-500">No members yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-800 text-left text-[10px] uppercase tracking-widest text-stone-500">
                        <th className="px-4 sm:px-5 py-2.5 font-semibold">Member</th>
                        <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">Department</th>
                        <th className="px-3 py-2.5 font-semibold">Category</th>
                        <th className="px-4 sm:px-5 py-2.5 font-semibold hidden md:table-cell">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/70">
                      {recent.map((m) => {
                        const cat = CATEGORIES.find((c) => c.key === m.category) ?? CATEGORIES[1];
                        return (
                          <tr key={m.id} className="hover:bg-white/[0.02]">
                            <td className="px-4 sm:px-5 py-2.5">
                              <p className="font-medium text-white">{m.fullName}</p>
                              <p className="font-mono text-[11px] text-stone-500">{m.registerNumber}</p>
                            </td>
                            <td className="px-3 py-2.5 text-stone-400 hidden sm:table-cell">{m.department}</td>
                            <td className="px-3 py-2.5">
                              <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${cat.chip}`}>
                                {cat.label}
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-2.5 text-stone-400 hidden md:table-cell">
                              {m.position ?? m.team ?? "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Panel title="Needs attention">
              <div className="divide-y divide-stone-800/70">
                <Attention icon={FileText} label="Reports awaiting review" count={pendingReports} href="/reports/review" />
                {isSuper && (
                  <Attention icon={FileBadge} label="OD requests awaiting approval" count={pendingOD} href="/od" />
                )}
                <Attention icon={Calendar} label="Members with no timetable" count={noTimetable} href="/timetable" />
              </div>
            </Panel>

            <Panel title="Upcoming events" action={isSuper ? { href: "/events", label: "Manage" } : undefined}>
              {events.length === 0 ? (
                <p className="px-5 py-6 text-sm text-stone-500">No upcoming events.</p>
              ) : (
                <ul className="divide-y divide-stone-800/70">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                      <div className="w-10 shrink-0 rounded border border-stone-800 bg-stone-900/60 py-1 text-center leading-tight">
                        <p className="text-[9px] uppercase tracking-wider text-sky-400">
                          {e.eventDate.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-white">
                          {e.eventDate.toLocaleDateString("en-IN", { day: "numeric", timeZone: "UTC" })}
                        </p>
                      </div>
                      <p className="truncate text-sm text-stone-200">{e.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Quick actions">
              <div className="divide-y divide-stone-800/70">
                <Action icon={UserPlus} label="Add a member" href="/members/add" />
                <Action icon={Search} label="Find free members" href="/search" />
                <Action icon={BarChart2} label="Availability analytics" href="/analytics" />
                <Action icon={Users} label="Manage members" href="/members" />
                {isSuper && <Action icon={CalendarDays} label="Add an event" href="/events" />}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI card: accent line on top, small caps label, big tabular number.
function Kpi({
  label,
  value,
  hint,
  href,
  warn,
}: {
  label: string;
  value: number;
  hint: string;
  href?: string;
  warn?: boolean;
}) {
  const body = (
    <div className="relative h-full overflow-hidden rounded-lg border border-stone-800 bg-[#17120f] p-4 transition-colors hover:border-stone-600">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${warn ? "bg-amber-400/80" : "bg-sky-500/70"}`} />
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 truncate text-xs text-stone-500">{hint}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

// Titled panel with an optional "view all" link in its header.
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-800 bg-[#17120f]">
      <header className="flex items-center justify-between border-b border-stone-800 px-4 sm:px-5 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">{title}</h2>
        {action && (
          <Link href={action.href} className="text-xs text-sky-400 hover:text-sky-300">
            {action.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function Attention({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-stone-800/70 text-stone-300">
        <Icon size={15} />
      </span>
      <span className="flex-1 text-sm text-stone-300">{label}</span>
      {count > 0 ? (
        <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-300">
          {count}
        </span>
      ) : (
        <CheckCircle size={15} className="text-emerald-400/70" />
      )}
    </Link>
  );
}

function Action({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 px-4 sm:px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
      <Icon size={15} className="text-stone-500 group-hover:text-sky-400" />
      <span className="flex-1 text-sm text-stone-300 group-hover:text-white">{label}</span>
      <ChevronRight size={14} className="text-stone-600 group-hover:text-stone-400" />
    </Link>
  );
}

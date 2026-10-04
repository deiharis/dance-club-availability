import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import Orbit from "@/components/dance/Orbit";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC", // dates are stored as UTC midnight; avoid a day shift
  });

// Gold gradient used for accent words, like the reference.
const GOLD = "bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 bg-clip-text text-transparent";

const STAGE_LINKS = [
  { title: "Rehearsals", text: "See what is next on the schedule and where to be.", href: "/dance/rehearsals" },
  { title: "Attendance", text: "Track how consistently you show up for the team.", href: "/dance/attendance" },
  { title: "Performances", text: "Find out which shows you are cast in.", href: "/dance/performances" },
  { title: "Reports", text: "Log your contributions for your Lead to verify.", href: "/reports/submit" },
];

export default async function DanceDashboardPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  const { member, isSuper, isLead } = dance;

  const isDancer = member.category === "DANCER";
  const team = isDancer ? member.team : null;
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

  // Dancers/Leads: their own team. SuperAdmin and Core: every team.
  const teamCounts =
    isDancer && !isSuper
      ? []
      : await db.member.groupBy({
          by: ["team"],
          where: { category: "DANCER" },
          _count: true,
        });

  const [teamSize, nextRehearsal, nextPerformance, marks] = team
    ? await Promise.all([
        db.member.count({ where: { category: "DANCER", team } }),
        db.rehearsal.findFirst({
          where: { team, date: { gte: today } },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        }),
        db.performance.findFirst({
          where: { team, eventDate: { gte: today } },
          orderBy: { eventDate: "asc" },
          include: { dancers: { where: { id: member.id }, select: { id: true } } },
        }),
        db.attendance.groupBy({
          by: ["status"],
          where: { memberId: member.id },
          _count: true,
        }),
      ])
    : [0, null, null, []];

  const count = (s: string) => marks.find((m) => m.status === s)?._count ?? 0;
  const present = count("PRESENT");
  const absent = count("ABSENT");
  // Same rule as the Attendance page: present / (present + absent); excused not counted.
  const attendancePct =
    present + absent === 0 ? "-" : `${Math.round((present / (present + absent)) * 100)}%`;

  const firstName = member.fullName.split(" ")[0];
  const roleLabel = isLead ? "Dance Lead" : member.position ?? "Dancer";
  const skillLabel = member.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur";
  const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

  return (
    <div className="relative overflow-hidden">
      {/* Hero: the animated wave from the layout runs behind this */}
      <section className="relative px-6 pt-16 pb-24 text-center sm:pt-24 sm:pb-32">
        <span
          className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-100/70"
          style={delay(0)}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-[stage-pulse_2.4s_ease-in-out_infinite]" />
          {isDancer ? (team ?? "No team yet") : "Dance Floor overview"}
        </span>

        <h1
          className={`anim-fade-up mt-6 text-6xl font-light tracking-tight sm:text-8xl ${GOLD}`}
          style={delay(120)}
        >
          {isDancer ? firstName : "Dance Floor"}
        </h1>

        <p className="anim-fade-up mx-auto mt-5 max-w-md text-sm text-amber-50/65" style={delay(240)}>
          {isDancer
            ? `Welcome back. ${roleLabel}, ${skillLabel.toLowerCase()} level.`
            : "Every team, every rehearsal and every performance in one place."}
        </p>

        <div className="anim-fade-up mt-8 flex justify-center gap-3" style={delay(360)}>
          <Link
            href="/dance/rehearsals"
            className="group inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/5 px-6 py-2.5 text-sm text-amber-50 shadow-[0_0_30px_-8px_rgba(251,191,36,0.6)] transition hover:border-amber-300/70 hover:bg-white/10"
          >
            View rehearsals
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        {isDancer && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Team", value: member.team ?? "Not assigned" },
              { label: "Team size", value: String(teamSize) },
              { label: "Skill level", value: skillLabel },
              { label: "Your attendance", value: attendancePct, href: "/dance/attendance" },
            ].map((s, i) => (
              <div key={s.label} className="anim-fade-up" style={delay(480 + i * 90)}>
                <Stat {...s} />
              </div>
            ))}
          </div>
        )}

        {/* Your stage: orbit beside a four-item list */}
        <section className="mt-24 text-center">
          <h2 className="text-3xl font-light tracking-tight sm:text-4xl">
            Everything for the <span className={GOLD}>show</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-amber-50/55">
            Your rehearsals, attendance and performances, kept together.
          </p>
        </section>

        <section className="mt-12 grid items-center gap-10 md:grid-cols-2">
          <Orbit />
          <ul className="space-y-6">
            {STAGE_LINKS.map((l) => (
              <li key={l.title}>
                <Link href={l.href} className="group flex items-start gap-4">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_10px_2px_rgba(251,191,36,0.7)]" />
                  <span>
                    <span className="flex items-center gap-2 text-lg font-light text-white">
                      {l.title}
                      <ArrowUpRight
                        size={15}
                        className="text-amber-100/40 transition group-hover:text-amber-300"
                      />
                    </span>
                    <span className="mt-1 block text-sm text-amber-50/55">{l.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {isDancer && (
          <>
            <h2 className="mt-24 text-center text-3xl font-light tracking-tight sm:text-4xl">
              Coming <span className={GOLD}>up</span>
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <Glow
                eyebrow="Next rehearsal"
                title={nextRehearsal ? nextRehearsal.title : "None scheduled"}
                sub={
                  nextRehearsal
                    ? `${fmt(nextRehearsal.date)} · ${nextRehearsal.startTime} - ${nextRehearsal.endTime}${
                        nextRehearsal.venue ? ` · ${nextRehearsal.venue}` : ""
                      }`
                    : undefined
                }
                href="/dance/rehearsals"
              />
              <Glow
                eyebrow="Next performance"
                title={nextPerformance ? nextPerformance.name : "None scheduled"}
                sub={
                  nextPerformance
                    ? `${fmt(nextPerformance.eventDate)}${
                        nextPerformance.venue ? ` · ${nextPerformance.venue}` : ""
                      }${nextPerformance.dancers.length ? " · You are in this" : ""}`
                    : undefined
                }
                href="/dance/performances"
              />
            </div>
          </>
        )}

        {teamCounts.length > 0 && (
          <>
            <h2 className="mt-24 text-center text-3xl font-light tracking-tight sm:text-4xl">
              Dancers <span className={GOLD}>per team</span>
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {teamCounts.map((t) => (
                <Stat key={t.team ?? "none"} label={t.team ?? "No team"} value={String(t._count)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Horizon arc */}
      <div className="pointer-events-none relative mt-24 h-44 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-10 h-[40rem] w-[130%] -translate-x-1/2 rounded-[100%] border-t border-amber-300/50 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.28),transparent_55%)] shadow-[0_-24px_90px_rgba(251,146,60,0.3)]" />
      </div>
    </div>
  );
}

// Glass stat card: small label, big light value.
function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <div className="h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-amber-300/30 hover:shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]">
      <p className="text-[11px] uppercase tracking-[0.16em] text-amber-100/45">{label}</p>
      <p className="mt-3 text-2xl font-light text-white">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

// Larger card with a glowing base, used for upcoming items.
function Glow({
  eyebrow,
  title,
  sub,
  href,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 pb-14 transition hover:border-amber-300/40"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.45),transparent_70%)] opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.16em] text-amber-100/45">{eyebrow}</p>
        <ArrowUpRight size={16} className="text-amber-100/50 group-hover:text-amber-300" />
      </div>
      <p className="relative mt-3 text-xl font-light text-white">{title}</p>
      {sub && <p className="relative mt-1 text-sm text-amber-50/60">{sub}</p>}
    </Link>
  );
}

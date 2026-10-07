import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import { todayIST } from "@/lib/notify";
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

export default async function DanceDashboardPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  const { member, isSuper, isLead } = dance;

  // Anyone in a dance team (pure dancers and members who also dance) gets their personal cards.
  const isDancer = !!member.team;
  const team = member.team;
  const today = todayIST();

  // Everyone sees their own team; the SuperAdmin and Advisory also see every team's size.
  const teamCounts =
    !dance.seesAllTeams
      ? []
      : await db.member.groupBy({
          by: ["team"],
          where: { team: { not: null } },
          _count: true,
        });

  const [teamSize, nextRehearsal, nextPerformance, marks] = team
    ? await Promise.all([
        db.member.count({ where: { team } }),
        db.rehearsal.findFirst({
          where: { team, date: { gte: today }, cancelledAt: null },
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        }),
        db.performance.findFirst({
          where: { team, eventDate: { gte: today }, cancelledAt: null },
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
    // Exactly one screen tall (minus the layout's top padding), so the page never scrolls.
    <div className="relative flex h-[calc(100dvh-5rem)] flex-col overflow-hidden px-4 sm:px-8 lg:h-[calc(100dvh-1rem)]">
      {/* Hero fills the free space; the orbit glows behind it */}
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
          <div className="scale-[1.6] sm:scale-[1.9]">
            <Orbit />
          </div>
        </div>

        <span
          className="anim-fade-up relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-100/70"
          style={delay(0)}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-[stage-pulse_2.4s_ease-in-out_infinite]" />
          {isDancer ? (team ?? "No team yet") : "Dance Floor overview"}
        </span>

        <h1
          className={`anim-fade-up relative mt-4 text-5xl font-light tracking-tight sm:text-7xl lg:text-8xl ${GOLD}`}
          style={delay(120)}
        >
          {isDancer ? firstName : "Dance Floor"}
        </h1>

        <p className="anim-fade-up relative mx-auto mt-3 max-w-md text-sm text-amber-50/65" style={delay(240)}>
          {isDancer
            ? `Welcome back. ${roleLabel}, ${skillLabel.toLowerCase()} level${member.isFFCS ? ", FFCS enrolled" : ""}.`
            : "Every team, every rehearsal and every performance in one place."}
        </p>

        <div className="anim-fade-up relative mt-5" style={delay(360)}>
          <Link
            href="/dance/rehearsals"
            className="group inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-white/5 px-6 py-2.5 text-sm text-amber-50 shadow-[0_0_30px_-8px_rgba(251,191,36,0.6)] transition hover:border-amber-300/70 hover:bg-white/10"
          >
            View rehearsals
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Bottom block: stats, then what is coming up. Compact so it always fits. */}
      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-3 pb-3">
        {isDancer && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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

            <div className="grid gap-3 sm:grid-cols-2">
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

        {/* SuperAdmin and Core: one row of team chips instead of big cards */}
        {teamCounts.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {teamCounts.map((t) => (
              <Link
                key={t.team ?? "none"}
                href={t.team ? `/dance/roster?team=${encodeURIComponent(t.team)}` : "/dance/roster"}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-amber-50/80 transition hover:border-amber-300/40 hover:text-white"
              >
                {t.team ?? "No team"}
                <span className="rounded-full bg-amber-300/15 px-2 py-0.5 text-xs tabular-nums text-amber-200">
                  {t._count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Horizon arc: fixed to the real bottom of the window, full width (it passes behind the
          glass sidebar like the wave does), and faded at the top so there is no hard edge. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-48 overflow-hidden [mask-image:linear-gradient(to_top,black_35%,transparent)]"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-16 h-[40rem] w-[130%] -translate-x-1/2 rounded-[100%] border-t border-amber-300/50 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.28),transparent_55%)] shadow-[0_-24px_90px_rgba(251,146,60,0.3)]" />
      </div>
    </div>
  );
}

// Compact glass stat tile: small label, value.
function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-amber-300/30 hover:shadow-[0_0_40px_-12px_rgba(251,191,36,0.5)]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-amber-100/45">{label}</p>
      <p className="mt-1 truncate text-lg font-light text-white">{value}</p>
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

// Compact card with a glowing base, used for upcoming items.
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
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-4 py-3 transition hover:border-amber-300/40"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.4),transparent_70%)] opacity-80 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-amber-100/45">{eyebrow}</p>
        <ArrowUpRight size={14} className="text-amber-100/50 group-hover:text-amber-300" />
      </div>
      <p className="relative mt-1 truncate text-base font-light text-white">{title}</p>
      {sub && <p className="relative truncate text-xs text-amber-50/60">{sub}</p>}
    </Link>
  );
}

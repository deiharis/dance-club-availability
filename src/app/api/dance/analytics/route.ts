import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { SLOTS, DAYS } from "@/lib/timetable";
import { DANCER_TEAMS } from "@/lib/teams";
import { getCaller, unauthorized, forbidden, leadReviewedWhere } from "@/lib/dance";
import type { TeamAnalytics, HeatCell } from "@/lib/analytics-types";

export const dynamic = "force-dynamic";

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");
const SLOT_NAMES = new Set(ACTIVE_SLOTS.map((s) => s.slot));
const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

// Analytics for ONE dance team. A Lead gets their own team; only the SuperAdmin can pass ?team=.
export async function GET(req: Request) {
  const caller = await getCaller();
  if (!caller) return unauthorized();

  const asked = new URL(req.url).searchParams.get("team");
  const team = caller.seesAllTeams ? asked ?? DANCER_TEAMS[0] : caller.member?.team ?? "";
  if (!DANCER_TEAMS.includes(team)) {
    return NextResponse.json({ error: "Unknown team" }, { status: 400 });
  }
  // Reading only: the team's Lead, the SuperAdmin, or the Advisory.
  if (!caller.seesAllTeams && !caller.canManage(team)) return forbidden();

  try {
    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

    const dancers = await db.member.findMany({
      where: { team },
      select: { id: true, fullName: true, skillLevel: true, position: true },
      orderBy: { fullName: "asc" },
    });
    const ids = dancers.map((d) => d.id);

    const [classEntries, rehearsals, attendance, performances, pendingReports] = await Promise.all([
      db.timetableEntry.findMany({ where: { memberId: { in: ids }, status: "CLASS" } }),
      db.rehearsal.findMany({ where: { team }, orderBy: { date: "asc" } }),
      db.attendance.findMany({ where: { memberId: { in: ids } } }),
      db.performance.findMany({ where: { team }, select: { eventDate: true } }),
      db.report.count({
        where: {
          status: "PENDING",
          ...leadReviewedWhere,
          member: { team, id: { not: caller.member?.id } },
        },
      }),
    ]);

    // Team availability: how many of the team are free in each slot
    const busy = new Map<string, number>();
    for (const e of classEntries) {
      if (!SLOT_NAMES.has(e.slot)) continue;
      const key = `${e.day}|${e.slot}`;
      busy.set(key, (busy.get(key) ?? 0) + 1);
    }
    const heatmap: HeatCell[] = [];
    for (const day of DAYS) {
      for (const s of ACTIVE_SLOTS) {
        const freeCount = dancers.length - (busy.get(`${day}|${s.slot}`) ?? 0);
        heatmap.push({ day, slot: s.slot, freeCount, percentage: pct(freeCount, dancers.length) });
      }
    }
    const bestSlots = [...heatmap]
      .sort((a, b) => b.percentage - a.percentage || b.freeCount - a.freeCount)
      .slice(0, 5);

    // Attendance per dancer and per rehearsal
    const rehearsalById = new Map(rehearsals.map((r) => [r.id, r]));
    const perDancer = new Map<string, { present: number; absent: number; excused: number }>();
    const perRehearsal = new Map<string, { present: number; absent: number }>();
    for (const a of attendance) {
      if (!rehearsalById.has(a.rehearsalId)) continue; // other team's rehearsal (dancer moved teams)
      const d = perDancer.get(a.memberId) ?? { present: 0, absent: 0, excused: 0 };
      const r = perRehearsal.get(a.rehearsalId) ?? { present: 0, absent: 0 };
      if (a.status === "PRESENT") {
        d.present++;
        r.present++;
      } else if (a.status === "ABSENT") {
        d.absent++;
        r.absent++;
      } else {
        d.excused++;
      }
      perDancer.set(a.memberId, d);
      perRehearsal.set(a.rehearsalId, r);
    }

    const members = dancers
      .map((d) => {
        const c = perDancer.get(d.id) ?? { present: 0, absent: 0, excused: 0 };
        const marked = c.present + c.absent;
        return {
          id: d.id,
          fullName: d.fullName,
          skillLevel: d.skillLevel,
          isLead: d.position === "Team Leader",
          ...c,
          rate: marked === 0 ? null : pct(c.present, marked),
          marked,
        };
      })
      .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101)); // lowest attendance first

    const trend = rehearsals
      .filter((r) => {
        const x = perRehearsal.get(r.id);
        return x && x.present + x.absent > 0;
      })
      .slice(-12)
      .map((r) => {
        const x = perRehearsal.get(r.id)!;
        return {
          label: r.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
          title: r.title,
          rate: pct(x.present, x.present + x.absent),
        };
      });

    const totalPresent = members.reduce((s, m) => s + m.present, 0);
    const totalAbsent = members.reduce((s, m) => s + m.absent, 0);

    const body: TeamAnalytics = {
      team,
      dancers: dancers.length,
      professional: dancers.filter((d) => d.skillLevel === "PROFESSIONAL").length,
      amateur: dancers.filter((d) => d.skillLevel === "AMATEUR").length,
      attendanceRate: totalPresent + totalAbsent === 0 ? null : pct(totalPresent, totalPresent + totalAbsent),
      rehearsalsHeld: rehearsals.filter((r) => r.date < today).length,
      rehearsalsUpcoming: rehearsals.filter((r) => r.date >= today).length,
      performancesUpcoming: performances.filter((p) => p.eventDate >= today).length,
      pendingReports,
      heatmap,
      bestSlots,
      everyoneFreeSlots: heatmap.filter((h) => h.percentage === 100).length,
      members,
      trend,
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

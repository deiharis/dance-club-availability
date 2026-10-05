import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { SLOTS, DAYS } from "@/lib/timetable";
import { DANCER_TEAMS } from "@/lib/teams";
import { normalizeDepartment } from "@/lib/departments";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import type {
  AnalyticsData,
  HeatCell,
  AvailabilityData,
  MembershipData,
  DanceData,
  ActivityData,
} from "@/lib/analytics-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");
const SLOT_NAMES = new Set(ACTIVE_SLOTS.map((s) => s.slot));
const SLOTS_PER_MEMBER = DAYS.length * ACTIVE_SLOTS.length;

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
const CATEGORY_LABEL: Record<string, string> = {
  CORE: "Core",
  MEMBER: "Normal",
  DANCER: "Dancer",
  FFCS_ONLY: "FFCS only",
};

export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const [members, entries, rehearsals, attendance, performances, reports, odRequests] =
      await Promise.all([
        db.member.findMany(),
        db.timetableEntry.findMany({ where: { status: "CLASS" } }),
        db.rehearsal.findMany({ orderBy: { date: "asc" } }),
        db.attendance.findMany({ select: { rehearsalId: true, memberId: true, status: true } }),
        db.performance.findMany({ select: { eventDate: true } }),
        db.report.findMany({
          select: {
            status: true,
            submittedAt: true,
            reviewedAt: true,
            member: { select: { fullName: true } },
          },
        }),
        db.oDRequest.findMany({ select: { status: true, event: { select: { name: true } } } }),
      ]);

    // Anyone who has saved a timetable row at all. CLASS rows are fetched above; a member whose
    // timetable is entirely free has no rows, so "no timetable" is an approximation (see CLAUDE.md).
    const withEntries = new Set(
      (await db.timetableEntry.findMany({ distinct: ["memberId"], select: { memberId: true } })).map(
        (e) => e.memberId
      )
    );

    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");

    // ── Availability ─────────────────────────────────────────────────────────
    const totalMembers = members.length;
    const classByCell = new Map<string, number>();
    const classByMember = new Map<string, number>();
    for (const e of entries) {
      if (!SLOT_NAMES.has(e.slot)) continue;
      const key = `${e.day}|${e.slot}`;
      classByCell.set(key, (classByCell.get(key) ?? 0) + 1);
      classByMember.set(e.memberId, (classByMember.get(e.memberId) ?? 0) + 1);
    }

    const heatmap: HeatCell[] = [];
    for (const day of DAYS) {
      for (const s of ACTIVE_SLOTS) {
        const freeCount = totalMembers - (classByCell.get(`${day}|${s.slot}`) ?? 0);
        heatmap.push({ day, slot: s.slot, freeCount, percentage: pct(freeCount, totalMembers) });
      }
    }

    const bestSlots = [...heatmap]
      .sort((a, b) => b.percentage - a.percentage || b.freeCount - a.freeCount)
      .slice(0, 5);

    const dayAverages = DAYS.map((day) => {
      const cells = heatmap.filter((h) => h.day === day);
      return { day, avg: Math.round(cells.reduce((s, c) => s + c.percentage, 0) / (cells.length || 1)) };
    });

    const slotCurve = ACTIVE_SLOTS.map((s) => {
      const row: Record<string, number | string> = { slot: s.slot };
      for (const day of DAYS) {
        row[day] = heatmap.find((h) => h.day === day && h.slot === s.slot)?.percentage ?? 0;
      }
      return row;
    });

    const memberAvailability = members
      .map((m) => ({
        id: m.id,
        fullName: m.fullName,
        category: m.category,
        percentage: pct(SLOTS_PER_MEMBER - (classByMember.get(m.id) ?? 0), SLOTS_PER_MEMBER),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const bands = [
      { range: "0-19%", min: 0, max: 19 },
      { range: "20-39%", min: 20, max: 39 },
      { range: "40-59%", min: 40, max: 59 },
      { range: "60-79%", min: 60, max: 79 },
      { range: "80-100%", min: 80, max: 100 },
    ];
    const histogram = bands.map((b) => ({
      range: b.range,
      count: memberAvailability.filter((m) => m.percentage >= b.min && m.percentage <= b.max).length,
    }));

    const byCategory = Object.keys(CATEGORY_LABEL).map((category) => {
      const list = memberAvailability.filter((m) => m.category === category);
      return {
        category,
        label: CATEGORY_LABEL[category],
        count: list.length,
        avg: list.length ? Math.round(list.reduce((s, m) => s + m.percentage, 0) / list.length) : 0,
      };
    });

    const availability: AvailabilityData = {
      totalMembers,
      overall: Math.round(heatmap.reduce((s, h) => s + h.percentage, 0) / (heatmap.length || 1)),
      heatmap,
      bestSlots,
      dayAverages,
      slotCurve,
      histogram,
      byCategory,
      memberAvailability,
      noTimetable: members.filter((m) => !withEntries.has(m.id)).length,
      completion: pct(members.filter((m) => withEntries.has(m.id)).length, totalMembers),
    };

    // ── Membership ───────────────────────────────────────────────────────────
    // Group by canonical programme and by degree, so "BBA Hons", "BBA HONS" and "BBA Honours"
    // (or any spelling of B.Tech CSE Core) count as one. See lib/departments.ts.
    const programmeCount = new Map<string, number>();
    const degreeCount = new Map<string, number>();
    for (const m of members) {
      const dept = normalizeDepartment(m.department);
      const label = dept.label || "Unknown";
      programmeCount.set(label, (programmeCount.get(label) ?? 0) + 1);
      degreeCount.set(dept.degree, (degreeCount.get(dept.degree) ?? 0) + 1);
    }
    const toRows = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    const programmes = toRows(programmeCount);
    const topDepts = programmes.slice(0, 9);
    const otherDepts = programmes.slice(9).reduce((s, p) => s + p.count, 0);
    if (otherDepts > 0) topDepts.push({ name: "Other", count: otherDepts });

    const monthCount = new Map<string, number>();
    for (const m of members) {
      const key = m.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthCount.set(key, (monthCount.get(key) ?? 0) + 1);
    }
    let running = 0;
    const growth = Array.from(monthCount.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, joined]) => {
        running += joined;
        return {
          month: new Date(month + "-01T00:00:00Z").toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
            timeZone: "UTC",
          }),
          joined,
          total: running,
        };
      });

    const membership: MembershipData = {
      total: totalMembers,
      byCategory: Object.keys(CATEGORY_LABEL).map((key) => ({
        key,
        label: CATEGORY_LABEL[key],
        count: members.filter((m) => m.category === key).length,
      })),
      byDepartment: topDepts,
      byDegree: toRows(degreeCount),
      byYear: [1, 2, 3, 4].map((y) => ({
        year: `Year ${y}`,
        count: members.filter((m) => m.academicYear === y).length,
      })),
      ffcs: {
        enrolled: members.filter((m) => m.isFFCS).length,
        notEnrolled: members.filter((m) => !m.isFFCS).length,
      },
      growth,
    };

    // ── Dance Floor ──────────────────────────────────────────────────────────
    // Everyone in a dance team, including Core / Normal members who also dance.
    const dancers = members.filter((m) => !!m.team);
    const rehearsalById = new Map(rehearsals.map((r) => [r.id, r]));
    const memberById = new Map(members.map((m) => [m.id, m]));

    // Attendance counts per team and per rehearsal
    const teamAtt = new Map<string, { present: number; absent: number; excused: number }>();
    const rehearsalAtt = new Map<string, { present: number; absent: number }>();
    for (const a of attendance) {
      const r = rehearsalById.get(a.rehearsalId);
      if (!r) continue;
      const t = teamAtt.get(r.team) ?? { present: 0, absent: 0, excused: 0 };
      const ra = rehearsalAtt.get(a.rehearsalId) ?? { present: 0, absent: 0 };
      if (a.status === "PRESENT") {
        t.present++;
        ra.present++;
      } else if (a.status === "ABSENT") {
        t.absent++;
        ra.absent++;
      } else {
        t.excused++;
      }
      teamAtt.set(r.team, t);
      rehearsalAtt.set(a.rehearsalId, ra);
    }

    // Best rehearsal slot per team: the day+slot where the largest share of the team is free
    const teams = DANCER_TEAMS.map((team) => {
      const teamMembers = dancers.filter((d) => d.team === team);
      const ids = new Set(teamMembers.map((d) => d.id));
      const busy = new Map<string, number>();
      for (const e of entries) {
        if (!ids.has(e.memberId) || !SLOT_NAMES.has(e.slot)) continue;
        const key = `${e.day}|${e.slot}`;
        busy.set(key, (busy.get(key) ?? 0) + 1);
      }
      let best: HeatCell | null = null;
      if (teamMembers.length > 0) {
        for (const day of DAYS) {
          for (const s of ACTIVE_SLOTS) {
            const free = teamMembers.length - (busy.get(`${day}|${s.slot}`) ?? 0);
            const p = pct(free, teamMembers.length);
            if (!best || p > best.percentage) best = { day, slot: s.slot, freeCount: free, percentage: p };
          }
        }
      }
      const att = teamAtt.get(team) ?? { present: 0, absent: 0, excused: 0 };
      return {
        team,
        dancers: teamMembers.length,
        professional: teamMembers.filter((d) => d.skillLevel === "PROFESSIONAL").length,
        amateur: teamMembers.filter((d) => d.skillLevel === "AMATEUR").length,
        ...att,
        attendanceRate: att.present + att.absent === 0 ? null : pct(att.present, att.present + att.absent),
        rehearsals: rehearsals.filter((r) => r.team === team).length,
        bestSlot: best,
      };
    });

    const totalPresent = teams.reduce((s, t) => s + t.present, 0);
    const totalAbsent = teams.reduce((s, t) => s + t.absent, 0);

    // Attendance rate of the most recent rehearsals that have been marked
    const attendanceTrend = rehearsals
      .filter((r) => {
        const a = rehearsalAtt.get(r.id);
        return a && a.present + a.absent > 0;
      })
      .slice(-12)
      .map((r) => {
        const a = rehearsalAtt.get(r.id)!;
        return {
          label: r.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
          team: r.team,
          rate: pct(a.present, a.present + a.absent),
          marked: a.present + a.absent,
        };
      });

    const dance: DanceData = {
      totalDancers: dancers.length,
      professional: dancers.filter((d) => d.skillLevel === "PROFESSIONAL").length,
      amateur: dancers.filter((d) => d.skillLevel === "AMATEUR").length,
      overallAttendance: totalPresent + totalAbsent === 0 ? null : pct(totalPresent, totalPresent + totalAbsent),
      teams,
      attendanceTrend,
      upcomingRehearsals: rehearsals.filter((r) => r.date >= today).length,
      upcomingPerformances: performances.filter((p) => p.eventDate >= today).length,
      pastPerformances: performances.filter((p) => p.eventDate < today).length,
    };

    // ── Activity: reports and OD ─────────────────────────────────────────────
    const countStatus = (s: string) => reports.filter((r) => r.status === s).length;
    const reviewed = reports.filter((r) => r.reviewedAt);
    const avgReviewHours = reviewed.length
      ? Math.round(
          (reviewed.reduce((s, r) => s + (r.reviewedAt!.getTime() - r.submittedAt.getTime()), 0) /
            reviewed.length /
            3_600_000) *
            10
        ) / 10
      : null;

    // Last 8 weeks, weeks starting Monday (UTC)
    const weekStart = (d: Date) => {
      const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
      return x;
    };
    const thisWeek = weekStart(new Date());
    const weekly = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(thisWeek);
      start.setUTCDate(start.getUTCDate() - (7 - i) * 7);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 7);
      const inWeek = reports.filter((r) => r.submittedAt >= start && r.submittedAt < end);
      return {
        week: start.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
        submitted: inWeek.length,
        approved: inWeek.filter((r) => r.status === "APPROVED").length,
      };
    });

    const eventCount = new Map<string, number>();
    for (const o of odRequests) {
      const name = o.event?.name ?? "No event";
      eventCount.set(name, (eventCount.get(name) ?? 0) + 1);
    }

    const approvedBy = new Map<string, number>();
    for (const r of reports) {
      if (r.status === "APPROVED") approvedBy.set(r.member.fullName, (approvedBy.get(r.member.fullName) ?? 0) + 1);
    }

    const activity: ActivityData = {
      reports: {
        pending: countStatus("PENDING"),
        approved: countStatus("APPROVED"),
        rejected: countStatus("REJECTED"),
        total: reports.length,
      },
      avgReviewHours,
      weekly,
      od: {
        pending: odRequests.filter((o) => o.status === "PENDING").length,
        approved: odRequests.filter((o) => o.status === "APPROVED").length,
      },
      odByEvent: Array.from(eventCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      topContributors: Array.from(approvedBy.entries())
        .map(([name, approved]) => ({ name, approved }))
        .sort((a, b) => b.approved - a.approved)
        .slice(0, 5),
    };

    const body: AnalyticsData = {
      generatedAt: new Date().toISOString(),
      availability,
      membership,
      dance: caller.seesAllTeams ? dance : null, // every team's dance data: SuperAdmin and Advisory only
      activity,
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

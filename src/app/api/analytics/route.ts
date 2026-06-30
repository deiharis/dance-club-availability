import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { SLOTS, DAYS } from "@/lib/timetable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");

export async function GET() {
  try {
    const members = await db.member.findMany();
    const allEntries = await db.timetableEntry.findMany();

    const totalMembers = members.length;

    // ── Heatmap data: for every day+slot, how many members are FREE ──
    const heatmap: { day: string; slot: string; freeCount: number; percentage: number }[] = [];

    for (const day of DAYS) {
      for (const slotInfo of ACTIVE_SLOTS) {
        const classCount = allEntries.filter(
          (e) => e.day === day && e.slot === slotInfo.slot && e.status === "CLASS"
        ).length;

        const freeCount = totalMembers - classCount;
        const percentage =
          totalMembers === 0 ? 0 : Math.round((freeCount / totalMembers) * 100);

        heatmap.push({ day, slot: slotInfo.slot, freeCount, percentage });
      }
    }

    // ── Best meeting time: highest free percentage ──
    const bestSlot = heatmap.reduce(
      (best, current) => (current.percentage > best.percentage ? current : best),
      heatmap[0] ?? { day: "", slot: "", freeCount: 0, percentage: 0 }
    );

    // ── Most / least available day (average free % across all slots that day) ──
    const dayAverages = DAYS.map((day) => {
      const daySlots = heatmap.filter((h) => h.day === day);
      const avg =
        daySlots.length === 0
          ? 0
          : Math.round(
              daySlots.reduce((sum, s) => sum + s.percentage, 0) / daySlots.length
            );
      return { day, avg };
    });

    const mostAvailableDay = dayAverages.reduce(
      (best, current) => (current.avg > best.avg ? current : best),
      dayAverages[0] ?? { day: "", avg: 0 }
    );

    const leastAvailableDay = dayAverages.reduce(
      (worst, current) => (current.avg < worst.avg ? current : worst),
      dayAverages[0] ?? { day: "", avg: 0 }
    );

    // ── Per-member availability percentage ──
    const totalSlotsPerMember = DAYS.length * ACTIVE_SLOTS.length;

    const memberAvailability = members.map((member) => {
      const classCount = allEntries.filter(
        (e) => e.memberId === member.id && e.status === "CLASS"
      ).length;

      const freeCount = totalSlotsPerMember - classCount;
      const percentage =
        totalSlotsPerMember === 0
          ? 100
          : Math.round((freeCount / totalSlotsPerMember) * 100);

      return {
        id: member.id,
        fullName: member.fullName,
        category: member.category,
        percentage,
      };
    });

    memberAvailability.sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json({
      totalMembers,
      heatmap,
      bestSlot,
      mostAvailableDay,
      leastAvailableDay,
      dayAverages,
      memberAvailability,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
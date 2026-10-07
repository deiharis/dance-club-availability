"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import Heatmap from "@/components/timetable/Heatmap";
import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";
import type { AvailabilityData } from "@/lib/analytics-types";
import { C, ANIM, tooltipStyle, Kpi, ChartCard, MeterRow, Empty } from "./parts";

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");
const DAY_COLORS: Record<string, string> = {
  MONDAY: C.violet,
  TUESDAY: C.indigo,
  WEDNESDAY: C.fuchsia,
  THURSDAY: C.teal,
  FRIDAY: C.amber,
};
const short = (day: string) => DAY_LABELS[day].slice(0, 3);
const slotTime = (slot: string) => ACTIVE_SLOTS.find((s) => s.slot === slot)?.time ?? "";
// Opens Search already set to this day and slot, so you see exactly who is free.
const whoIsFree = (day: string, slot: string) => `/search?day=${day}&slots=${slot}`;
const CATEGORY_SHORT: Record<string, string> = { CORE: "Core", DANCER: "Dancer", FFCS_ONLY: "FFCS only", MEMBER: "Normal" };

// all = everyone (no timetable counts as free everywhere, the app-wide rule);
// filled = only members who have filled in a timetable. A switch picks which one is shown.
export default function AvailabilityTab({ all, filled }: { all: AvailabilityData; filled: AvailabilityData }) {
  const [onlyFilled, setOnlyFilled] = useState(false);
  const d = onlyFilled ? filled : all;
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"most" | "least">("most");
  const [showAll, setShowAll] = useState(false);

  const best = d.bestSlots[0];
  const busiest = [...d.dayAverages].sort((a, b) => a.avg - b.avg)[0];

  const dayBars = d.dayAverages.map((x) => ({ day: short(x.day), avg: x.avg }));

  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = d.memberAvailability.filter((m) => !q || m.fullName.toLowerCase().includes(q));
    return order === "most" ? list : [...list].reverse();
  }, [d.memberAvailability, query, order]);
  const visible = showAll || query ? members : members.slice(0, 10);

  if (all.totalMembers === 0) return <Empty>Add members and their timetables to see availability analytics.</Empty>;

  return (
    <div className="space-y-6">
      {/* Who the numbers are about */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        {all.noTimetable > 0 && !onlyFilled && (
          <p className="flex min-w-0 flex-1 items-start gap-2 text-xs text-amber-200/90">
            <AlertTriangle size={14} className="mt-px shrink-0 text-amber-400" aria-hidden="true" />
            <span>
              {all.noTimetable} of {all.totalMembers} members have not set a timetable, so they count as free in every slot and push these numbers up.
            </span>
          </p>
        )}
        {onlyFilled && (
          <p className="min-w-0 flex-1 text-xs text-zinc-400">
            Showing the {filled.totalMembers} members who have filled in a timetable. {all.noTimetable} without one are left out.
          </p>
        )}
        {all.noTimetable === 0 && <p className="min-w-0 flex-1 text-xs text-zinc-400">Everyone has filled in a timetable, so these numbers are complete.</p>}
        {all.noTimetable > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-200">
            <input type="checkbox" checked={onlyFilled} onChange={(e) => setOnlyFilled(e.target.checked)} className="h-4 w-4 accent-violet-500" />
            Only members with a timetable
          </label>
        )}
      </div>

      {d.totalMembers === 0 ? (
        <Empty>Nobody has filled in a timetable yet.</Empty>
      ) : (
      <>
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Best meeting slot"
          text={best ? `${short(best.day)} ${best.slot}` : "-"}
          hint={best ? `${best.percentage}% free · ${slotTime(best.slot)}` : undefined}
          delay={0}
        />
        <Kpi label="Overall availability" value={d.overall} suffix="%" hint="Average across every slot" tone="emerald" delay={80} />
        <Kpi
          label="Busiest day"
          text={busiest ? DAY_LABELS[busiest.day] : "-"}
          hint={busiest ? `${busiest.avg}% free on average` : undefined}
          tone="red"
          delay={160}
        />
        <Kpi
          label="Timetables filled"
          value={all.completion}
          suffix="%"
          hint={all.noTimetable > 0 ? `${all.noTimetable} member${all.noTimetable === 1 ? "" : "s"} with no entries yet` : "Everyone has a timetable"}
          tone={all.noTimetable > 0 ? "amber" : "emerald"}
          delay={240}
        />
      </div>

      {/* Curve and ranking */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Availability through the day"
          subtitle={`Free % of ${onlyFilled ? "members with a timetable" : "all members"} in each slot, one line per weekday`}
          className="lg:col-span-2"
          delay={100}
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={d.slotCurve} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
                <XAxis dataKey="slot" stroke={C.axis} fontSize={11} />
                <YAxis stroke={C.axis} fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {DAYS.map((day) => (
                  <Line
                    key={day}
                    type="monotone"
                    dataKey={day}
                    name={short(day)}
                    stroke={DAY_COLORS[day]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    {...ANIM}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Best times to meet" subtitle="Top 5 slots by members free. Click one to see who." delay={180}>
          {d.bestSlots.map((s, i) => (
            <Link key={`${s.day}${s.slot}`} href={whoIsFree(s.day, s.slot)} className="-mx-2 block rounded-md px-2 transition-colors duration-200 hover:bg-white/[0.04]">
              <MeterRow
                index={i}
                label={`${i + 1}. ${short(s.day)} ${s.slot}`}
                sub={`${slotTime(s.slot)} · ${s.freeCount} free`}
                value={s.percentage}
                color={i === 0 ? C.emerald : C.violet}
              />
            </Link>
          ))}
        </ChartCard>
      </div>

      {/* Heatmap */}
      <ChartCard title="Availability heatmap" subtitle="Every slot of the week. The ringed cell is the best slot. Click any cell to see who is free." delay={140}>
        <Heatmap data={d.heatmap} days={DAYS} slots={ACTIVE_SLOTS} highlight={best ? { day: best.day, slot: best.slot } : null} cellHref={whoIsFree} />
      </ChartCard>

      {/* Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Average by day" subtitle="Free % across the day's slots" delay={100}>
          <div style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={dayBars} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.violetLight} />
                    <stop offset="100%" stopColor="#5b21b6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke={C.axis} fontSize={11} />
                <YAxis stroke={C.axis} fontSize={11} domain={[0, 100]} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Free"]} />
                <Bar dataKey="avg" fill="url(#gDay)" radius={[6, 6, 0, 0]} {...ANIM}>
                  <LabelList dataKey="avg" position="top" fill="#a1a1aa" fontSize={11} formatter={(v) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="How free is everyone?" subtitle="Members by their overall free %" delay={160}>
          <div style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={d.histogram} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" stroke={C.axis} fontSize={10} />
                <YAxis stroke={C.axis} fontSize={11} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}`, "Members"]} />
                <Bar dataKey="count" fill="url(#gHist)" radius={[6, 6, 0, 0]} {...ANIM}>
                  <LabelList dataKey="count" position="top" fill="#a1a1aa" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="By category" subtitle="Average member availability" delay={220}>
          {d.byCategory
            .filter((c) => c.count > 0)
            .map((c, i) => (
              <MeterRow key={c.category} index={i} label={c.label} sub={`${c.count} member${c.count === 1 ? "" : "s"}`} value={c.avg} />
            ))}
        </ChartCard>
      </div>

      {/* Members */}
      <ChartCard title="Member availability" subtitle="Each member's free % across the whole week" delay={120}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a member"
            className="w-56 rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white placeholder-zinc-600"
          />
          <div className="inline-flex rounded-lg border border-zinc-800 bg-black/30 p-1">
            {(["most", "least"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOrder(o)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  order === o ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {o === "most" ? "Most free" : "Least free"}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {visible.map((m, i) =>
            m.hasTimetable ? (
              <MeterRow key={m.id} index={i} label={m.fullName} sub={CATEGORY_SHORT[m.category] ?? "Normal"} value={m.percentage} />
            ) : (
              <div key={m.id} className="flex items-center justify-between gap-4 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-300">{m.fullName}</p>
                  <p className="text-xs text-zinc-500">{CATEGORY_SHORT[m.category] ?? "Normal"}</p>
                </div>
                <Link
                  href={`/timetable/${m.id}`}
                  className="flex shrink-0 items-center gap-1 rounded bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 hover:bg-amber-400/20"
                >
                  No timetable <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </div>
            )
          )}
          {visible.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No members match.</p>}
        </div>
        {!query && members.length > 10 && (
          <button onClick={() => setShowAll((s) => !s)} className="mt-3 text-xs font-semibold text-violet-300 hover:text-violet-200">
            {showAll ? "Show fewer" : `Show all ${members.length}`}
          </button>
        )}
      </ChartCard>
      </>
      )}
    </div>
  );
}

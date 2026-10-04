"use client";

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Heatmap from "@/components/timetable/Heatmap";
import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";
import type { TeamAnalytics } from "@/lib/analytics-types";
import { C, ANIM, tooltipStyle, Kpi, ChartCard, MeterRow, CountUp, Empty } from "@/components/analytics/parts";

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");
const PRO = C.orange;
const AMA = "#fbbf24";
const short = (day: string) => DAY_LABELS[day].slice(0, 3);
const slotTime = (slot: string) => ACTIVE_SLOTS.find((s) => s.slot === slot)?.time ?? "";

// Everything a Dance Lead needs about their own team, in the Dance Floor look.
export default function TeamAnalyticsView({ team }: { team: string }) {
  const [data, setData] = useState<TeamAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    fetch(`/api/dance/analytics?team=${encodeURIComponent(team)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch(() => setError("Could not load analytics. Try refreshing the page."));
  }, [team]);

  if (error) return <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>;
  if (!data) return <p className="py-16 text-center text-sm text-orange-100/50">Loading team analytics...</p>;
  if (data.dancers === 0) return <Empty>No dancers in {team} yet. Add dancers from the Roster.</Empty>;

  const best = data.bestSlots[0];
  const skill = [
    { name: "Professional", value: data.professional, color: PRO },
    { name: "Amateur", value: data.amateur, color: AMA },
  ].filter((s) => s.value > 0);
  const slipping = data.members.filter((m) => m.rate !== null && m.marked >= 2 && m.rate < 70);

  return (
    <div className="stage-charts space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Dancers" value={data.dancers} tone="amber" hint={`${data.professional} professional, ${data.amateur} amateur`} />
        <Kpi
          label="Team attendance"
          {...(data.attendanceRate === null ? { text: "-" } : { value: data.attendanceRate, suffix: "%" })}
          hint={data.attendanceRate === null ? "Nothing marked yet" : `Across ${data.rehearsalsHeld} rehearsals`}
          tone="emerald"
          delay={80}
        />
        <Kpi
          label="Best rehearsal slot"
          text={best ? `${short(best.day)} ${best.slot}` : "-"}
          hint={best ? `${best.percentage}% of the team free` : undefined}
          tone="amber"
          delay={160}
        />
        <Kpi
          label="Reports to review"
          value={data.pendingReports}
          tone={data.pendingReports > 0 ? "amber" : "emerald"}
          hint={`${data.rehearsalsUpcoming} rehearsals and ${data.performancesUpcoming} performances ahead`}
          delay={240}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Attendance trend" subtitle="The last 12 rehearsals with attendance marked" className="lg:col-span-2" delay={100}>
          {data.trend.length < 2 ? (
            <Empty>The trend appears once two rehearsals have attendance marked.</Empty>
          ) : (
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <AreaChart data={data.trend} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTeamTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.orange} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" stroke={C.axis} fontSize={11} />
                  <YAxis stroke={C.axis} fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip {...tooltipStyle} formatter={(v, _n, p) => [`${v}%`, (p?.payload as { title: string }).title]} />
                  <Area type="monotone" dataKey="rate" stroke={C.orange} strokeWidth={2.5} fill="url(#gTeamTrend)" dot={{ r: 3, fill: C.orange }} {...ANIM} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Skill mix" subtitle="Professional and amateur dancers" delay={160}>
          <div className="relative" style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={skill} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3} stroke="none" {...ANIM}>
                  {skill.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold tabular-nums text-white">
                <CountUp value={data.dancers} />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">dancers</p>
            </div>
          </div>
          <ul className="mt-2 space-y-1.5">
            {skill.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                {s.name}
                <span className="ml-auto font-semibold tabular-nums text-zinc-200">{s.value}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Attendance by dancer"
          subtitle={
            slipping.length > 0
              ? `${slipping.length} dancer${slipping.length === 1 ? "" : "s"} below 70%: worth a conversation`
              : "Lowest first. Nobody is below 70%."
          }
          delay={100}
        >
          {data.members.map((m, i) => (
            <MeterRow
              key={m.id}
              index={i}
              label={m.fullName}
              sub={m.rate === null ? "No attendance marked" : `${m.present} present, ${m.absent} absent${m.excused ? `, ${m.excused} excused` : ""}`}
              value={m.rate ?? 0}
              color={m.rate === null ? "#52525b" : m.rate < 70 ? C.red : m.rate < 85 ? C.amber : C.emerald}
            />
          ))}
        </ChartCard>

        <ChartCard
          title="Best times to rehearse"
          subtitle={
            data.everyoneFreeSlots > 0
              ? `${data.everyoneFreeSlots} slot${data.everyoneFreeSlots === 1 ? "" : "s"} each week when the whole team is free`
              : "No slot has the whole team free; these come closest"
          }
          delay={160}
        >
          {data.bestSlots.map((s, i) => (
            <MeterRow
              key={`${s.day}${s.slot}`}
              index={i}
              label={`${i + 1}. ${DAY_LABELS[s.day]} ${s.slot}`}
              sub={`${slotTime(s.slot)} · ${s.freeCount} of ${data.dancers} free`}
              value={s.percentage}
              color={i === 0 ? C.emerald : C.orange}
            />
          ))}
        </ChartCard>
      </div>

      <ChartCard title="Team availability heatmap" subtitle="Free % of your team in every slot. The ringed cell is the best slot." delay={140}>
        <Heatmap data={data.heatmap} days={DAYS} slots={ACTIVE_SLOTS} highlight={best ? { day: best.day, slot: best.slot } : null} />
      </ChartCard>
    </div>
  );
}

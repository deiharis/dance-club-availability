"use client";

import React from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { DAY_LABELS } from "@/lib/timetable";
import type { DanceData } from "@/lib/analytics-types";
import { C, ANIM, tooltipStyle, Kpi, ChartCard, Empty } from "./parts";

// Dance Floor palette: orange for professional, amber for amateur.
const PRO = C.orange;
const AMA = "#fbbf24";

export default function DanceTab({ d }: { d: DanceData }) {
  if (d.totalDancers === 0) return <Empty>No dancers yet. Add dancers to see Dance Floor analytics.</Empty>;

  const activeTeams = d.teams.filter((t) => t.dancers > 0);
  const proShare = Math.round((d.professional / d.totalDancers) * 100);

  const attendanceBars = activeTeams.map((t) => ({
    team: t.team,
    rate: t.attendanceRate ?? 0,
    marked: t.present + t.absent,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Dancers" value={d.totalDancers} tone="amber" hint={`Across ${activeTeams.length} team${activeTeams.length === 1 ? "" : "s"}`} delay={0} />
        <Kpi
          label="Average attendance"
          {...(d.overallAttendance === null ? { text: "-" } : { value: d.overallAttendance, suffix: "%" })}
          hint={d.overallAttendance === null ? "No attendance marked yet" : "Present out of present plus absent"}
          tone="emerald"
          delay={80}
        />
        <Kpi label="Professional dancers" value={proShare} suffix="%" hint={`${d.professional} professional, ${d.amateur} amateur`} tone="amber" delay={160} />
        <Kpi label="Coming up" value={d.upcomingRehearsals} hint={`rehearsals, ${d.upcomingPerformances} performance${d.upcomingPerformances === 1 ? "" : "s"}`} delay={240} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Team size and skill mix" subtitle="Professional and amateur dancers per team" delay={100}>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={activeTeams} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="team" stroke={C.axis} fontSize={10} interval={0} />
                <YAxis stroke={C.axis} fontSize={11} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="professional" name="Professional" stackId="skill" fill={PRO} {...ANIM} />
                <Bar dataKey="amateur" name="Amateur" stackId="skill" fill={AMA} radius={[6, 6, 0, 0]} {...ANIM} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Attendance by team" subtitle="Present out of present plus absent" delay={160}>
          {attendanceBars.every((a) => a.marked === 0) ? (
            <Empty>No attendance marked yet.</Empty>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={attendanceBars} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.emerald} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="team" stroke={C.axis} fontSize={10} interval={0} />
                  <YAxis stroke={C.axis} fontSize={11} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={(v, _n, p) => [`${v}% (${(p?.payload as { marked: number }).marked} marks)`, "Attendance"]} />
                  <Bar dataKey="rate" fill="url(#gAtt)" radius={[6, 6, 0, 0]} {...ANIM}>
                    <LabelList dataKey="rate" position="top" fill="#a1a1aa" fontSize={11} formatter={(v) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Attendance trend" subtitle="The last 12 rehearsals with attendance marked" delay={120}>
        {d.attendanceTrend.length < 2 ? (
          <Empty>The trend appears once at least two rehearsals have attendance marked.</Empty>
        ) : (
          <div style={{ width: "100%", height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={d.attendanceTrend} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.orange} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke={C.axis} fontSize={11} />
                <YAxis stroke={C.axis} fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v, _n, p) => [`${v}%`, (p?.payload as { team: string }).team]}
                />
                <Area type="monotone" dataKey="rate" stroke={C.orange} strokeWidth={2.5} fill="url(#gTrend)" dot={{ r: 3, fill: C.orange }} {...ANIM} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Best rehearsal time per team" subtitle="The day and slot when the largest share of each team is free" delay={160}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                <th className="py-2 pr-4">Team</th>
                <th className="py-2 pr-4">Dancers</th>
                <th className="py-2 pr-4">Best slot</th>
                <th className="py-2 pr-4">Free</th>
                <th className="py-2">Rehearsals held</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTeams.map((t) => (
                <tr key={t.team}>
                  <td className="py-2.5 pr-4 font-semibold text-white">{t.team}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-zinc-300">{t.dancers}</td>
                  <td className="py-2.5 pr-4 text-zinc-300">
                    {t.bestSlot ? `${DAY_LABELS[t.bestSlot.day]} ${t.bestSlot.slot}` : "-"}
                  </td>
                  <td className="py-2.5 pr-4">
                    {t.bestSlot && (
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-300">
                        {t.bestSlot.percentage}% ({t.bestSlot.freeCount}/{t.dancers})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 tabular-nums text-zinc-300">{t.rehearsals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

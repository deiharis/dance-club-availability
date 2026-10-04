"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { ActivityData } from "@/lib/analytics-types";
import { C, ANIM, tooltipStyle, Kpi, ChartCard, MeterRow, CountUp, Empty } from "./parts";

export default function ActivityTab({ d }: { d: ActivityData }) {
  const r = d.reports;
  const pie = [
    { name: "Pending", value: r.pending, color: C.amber },
    { name: "Approved", value: r.approved, color: C.emerald },
    { name: "Rejected", value: r.rejected, color: C.red },
  ].filter((p) => p.value > 0);
  const approvalRate = r.approved + r.rejected === 0 ? null : Math.round((r.approved / (r.approved + r.rejected)) * 100);
  const maxContrib = d.topContributors[0]?.approved ?? 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Reports pending" value={r.pending} tone={r.pending > 0 ? "amber" : "emerald"} hint="Waiting for a decision" delay={0} />
        <Kpi
          label="Approval rate"
          {...(approvalRate === null ? { text: "-" } : { value: approvalRate, suffix: "%" })}
          hint={`${r.approved} approved, ${r.rejected} rejected`}
          tone="emerald"
          delay={80}
        />
        <Kpi
          label="Average review time"
          {...(d.avgReviewHours === null ? { text: "-" } : { value: d.avgReviewHours, suffix: "h", decimals: 1 })}
          hint="From submitted to decided"
          delay={160}
        />
        <Kpi label="OD requests pending" value={d.od.pending} tone={d.od.pending > 0 ? "amber" : "emerald"} hint={`${d.od.approved} approved so far`} delay={240} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Report status" subtitle={`${r.total} reports in total`} delay={100}>
          {r.total === 0 ? (
            <Empty>No reports yet.</Empty>
          ) : (
            <>
              <div className="relative" style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none" {...ANIM}>
                      {pie.map((p) => (
                        <Cell key={p.name} fill={p.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold tabular-nums text-white">
                    <CountUp value={r.total} />
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">reports</p>
                </div>
              </div>
              <ul className="mt-2 space-y-1.5">
                {pie.map((p) => (
                  <li key={p.name} className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                    {p.name}
                    <span className="ml-auto font-semibold tabular-nums text-zinc-200">{p.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ChartCard>

        <ChartCard title="Reports per week" subtitle="Submitted and approved, last 8 weeks" className="lg:col-span-2" delay={160}>
          <div style={{ width: "100%", height: 270 }}>
            <ResponsiveContainer>
              <LineChart data={d.weekly} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke={C.axis} fontSize={11} />
                <YAxis stroke={C.axis} fontSize={11} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="submitted" name="Submitted" stroke={C.violetLight} strokeWidth={2.5} dot={{ r: 3 }} {...ANIM} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke={C.emerald} strokeWidth={2.5} dot={{ r: 3 }} {...ANIM} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="OD requests by event" subtitle="Which events members ask for OD on" delay={100}>
          {d.odByEvent.length === 0 ? (
            <Empty>No OD requests yet.</Empty>
          ) : (
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={d.odByEvent} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gOd" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4338ca" stopOpacity={0.7} />
                      <stop offset="100%" stopColor={C.indigo} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke={C.axis} fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke={C.axis} fontSize={11} width={110} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}`, "Requests"]} />
                  <Bar dataKey="count" fill="url(#gOd)" radius={[0, 6, 6, 0]} {...ANIM}>
                    <LabelList dataKey="count" position="right" fill="#a1a1aa" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Top contributors" subtitle="Members with the most approved reports" delay={160}>
          {d.topContributors.length === 0 ? (
            <Empty>No approved reports yet.</Empty>
          ) : (
            d.topContributors.map((c, i) => (
              <MeterRow key={c.name} index={i} label={`${i + 1}. ${c.name}`} value={c.approved} max={maxContrib} suffix="" color={i === 0 ? C.emerald : C.violet} />
            ))
          )}
        </ChartCard>
      </div>
    </div>
  );
}

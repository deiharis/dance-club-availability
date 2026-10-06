"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { MembershipData } from "@/lib/analytics-types";
import { C, ANIM, tooltipStyle, Kpi, ChartCard, Gauge, CountUp, Empty } from "./parts";

const CAT_COLORS: Record<string, string> = {
  CORE: C.violet,
  MEMBER: "#a1a1aa",
  DANCER: C.pink,
  FFCS_ONLY: C.teal,
};

// Y-axis label that is shortened with an ellipsis (full name on hover) so long programme
// names can never overlap the next row.
function YTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x = 0, y = 0, payload } = props;
  const full = String(payload?.value ?? "");
  const text = full.length > 28 ? `${full.slice(0, 27)}...` : full;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill={C.axis} fontSize={11}>
      <title>{full}</title>
      {text}
    </text>
  );
}

export default function MembershipTab({ d }: { d: MembershipData }) {
  const [view, setView] = useState<"programme" | "degree">("programme");
  const [showAll, setShowAll] = useState(false);
  if (d.total === 0) return <Empty>No members yet.</Empty>;

  // Programmes: the top 12, then the rest in one clearly named bar (or all of them).
  const TOP = 12;
  const rest = d.byDepartment.slice(TOP);
  const programmeRows =
    showAll || rest.length === 0
      ? d.byDepartment
      : [
          ...d.byDepartment.slice(0, TOP),
          { name: `${rest.length} other programmes`, count: rest.reduce((s, r) => s + r.count, 0) },
        ];
  const rows = view === "degree" ? d.byDegree : programmeRows;
  const chartHeight = Math.max(220, rows.length * 38 + 40); // one comfortable row per bar
  const yWidth = view === "degree" ? 120 : 210;

  const count = (key: string) => d.byCategory.find((c) => c.key === key)?.count ?? 0;
  const pie = d.byCategory.filter((c) => c.count > 0);
  const ffcsPct = Math.round((d.ffcs.enrolled / d.total) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total members" value={d.total} delay={0} />
        <Kpi label="Core team" value={count("CORE")} hint={`${Math.round((count("CORE") / d.total) * 100)}% of the club`} delay={80} />
        <Kpi label="Dancers" value={count("DANCER")} tone="amber" hint={`${Math.round((count("DANCER") / d.total) * 100)}% of the club`} delay={160} />
        <Kpi label="FFCS enrolled" value={d.ffcs.enrolled} tone="emerald" hint={`${ffcsPct}% of the club`} delay={240} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Who is in the club" subtitle="Members by category" delay={100}>
          <div className="relative" style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="count" nameKey="label" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none" {...ANIM}>
                  {pie.map((c) => (
                    <Cell key={c.key} fill={CAT_COLORS[c.key]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold tabular-nums text-white">
                <CountUp value={d.total} />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">members</p>
            </div>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {pie.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CAT_COLORS[c.key] }} />
                {c.label}
                <span className="ml-auto font-semibold tabular-nums text-zinc-200">{c.count}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title={view === "degree" ? "By degree" : "By programme"}
          subtitle="Different spellings of the same programme are counted together"
          className="lg:col-span-2"
          delay={160}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-zinc-800 bg-black/30 p-1">
            {(["programme", "degree"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  view === v ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {v === "programme" ? "Programme" : "Degree"}
              </button>
            ))}
          </div>
          {view === "programme" && rest.length > 0 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="rounded-md border border-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
            >
              {showAll ? `Show top ${TOP}` : `Show all ${d.byDepartment.length}`}
            </button>
          )}
          </div>
          <div key={`${view}-${showAll}`} style={{ width: "100%", height: chartHeight }}>
            <ResponsiveContainer>
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDept" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5b21b6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor={C.violetLight} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={C.axis} fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke={C.axis} width={yWidth} tick={<YTick />} interval={0} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}`, "Members"]} />
                <Bar dataKey="count" fill="url(#gDept)" radius={[0, 6, 6, 0]} {...ANIM}>
                  <LabelList dataKey="count" position="right" fill="#a1a1aa" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="By academic year" delay={100}>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={d.byYear} margin={{ top: 18, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gYear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.fuchsia} />
                    <stop offset="100%" stopColor="#701a75" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" stroke={C.axis} fontSize={11} />
                <YAxis stroke={C.axis} fontSize={11} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}`, "Members"]} />
                <Bar dataKey="count" fill="url(#gYear)" radius={[6, 6, 0, 0]} {...ANIM}>
                  <LabelList dataKey="count" position="top" fill="#a1a1aa" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="FFCS enrolment" subtitle={`${d.ffcs.enrolled} of ${d.total} members`} delay={160}>
          <div className="pt-2">
            <Gauge value={ffcsPct} label="enrolled" color={C.emerald} size={170} />
          </div>
        </ChartCard>

        <ChartCard title="Membership growth" subtitle="Total members by month joined" delay={220}>
          {d.growth.length < 2 ? (
            <Empty>Growth shows once members have joined in more than one month.</Empty>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={d.growth} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gGrow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.violet} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke={C.axis} fontSize={11} />
                  <YAxis stroke={C.axis} fontSize={11} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="total" name="Total" stroke={C.violetLight} strokeWidth={2} fill="url(#gGrow)" {...ANIM} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

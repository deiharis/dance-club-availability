"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { Sparkles, AlertTriangle, CalendarClock, Users, CheckCircle2, XCircle, Info, Crown } from "lucide-react";
import { DAYS, DAY_LABELS } from "@/lib/timetable";
import {
  ACTIVE_SLOTS,
  cellKey,
  computeAvailability,
  type AvailabilityCell,
  type AvailabilityResponse,
} from "@/lib/availability";
import { C, ANIM, tooltipStyle, Kpi, ChartCard, MeterRow, CountUp, Empty } from "@/components/analytics/parts";

type Skill = "ALL" | "PROFESSIONAL" | "AMATEUR";
const short = (day: string) => DAY_LABELS[day].slice(0, 3);
const label = (c: AvailabilityCell) => `${DAY_LABELS[c.day]} — ${c.slot}`;
// Heat colour: stronger orange = more of the team free. The transition makes filter changes glide.
const heat = (pct: number) => `rgba(249, 115, 22, ${0.06 + (pct / 100) * 0.74})`;

export default function AvailabilityView({ team }: { team: string }) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState("");
  const [skill, setSkill] = useState<Skill>("ALL");
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError("");
    setPinned(null);
    setSkill("ALL");
    fetch(`/api/dance/availability?team=${encodeURIComponent(team)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setData(d);
      })
      .catch(() => setError("Could not load availability. Try refreshing the page."));
  }, [team]);

  // The server computed the whole team; a skill filter re-runs the same maths in the browser.
  const a = useMemo(() => {
    if (!data) return null;
    if (skill === "ALL") return data.all;
    return computeAvailability(data.dancers.filter((d) => d.skillLevel === skill));
  }, [data, skill]);

  if (error) return <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>;
  if (!data || !a) return <Skeleton />;
  if (data.dancers.length === 0) return <Empty>No dancers in {team} yet. Add dancers from the Roster.</Empty>;

  const names = new Map(data.dancers.map((d) => [d.id, d.fullName]));
  const byKey = new Map(a.cells.map((c) => [cellKey(c.day, c.slot), c]));
  const activeKey = pinned ?? hovered;
  const active = (activeKey && byKey.get(activeKey)) || a.bestCell;
  const bestKey = a.bestCell ? cellKey(a.bestCell.day, a.bestCell.slot) : null;
  const count = (s: Skill) => (s === "ALL" ? data.dancers.length : data.dancers.filter((d) => d.skillLevel === s).length);
  const select = (c: AvailabilityCell) => {
    const k = cellKey(c.day, c.slot);
    setPinned((p) => (p === k ? null : k));
  };

  return (
    <div className="stage-charts space-y-6">
      {/* Filter + data-quality note */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1">
          {(["ALL", "PROFESSIONAL", "AMATEUR"] as Skill[]).map((s) => (
            <button
              key={s}
              onClick={() => setSkill(s)}
              disabled={count(s) === 0}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-40 ${
                skill === s
                  ? "bg-orange-500 text-white shadow-[0_0_18px_-6px_rgba(249,115,22,0.9)]"
                  : "text-orange-100/60 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All dancers" : s === "PROFESSIONAL" ? "Professional" : "Amateur"}{" "}
              <span className="tabular-nums opacity-70">{count(s)}</span>
            </button>
          ))}
        </div>
        {a.noTimetable > 0 && (
          <p className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
            <Info size={13} />
            {a.noTimetable} dancer{a.noTimetable === 1 ? " has" : "s have"} not set a timetable and count as free everywhere
          </p>
        )}
      </div>

      {a.total === 0 ? (
        <Empty>No {skill === "PROFESSIONAL" ? "professional" : "amateur"} dancers in {team}.</Empty>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Team availability" value={a.overall} suffix="%" decimals={1} tone="amber" hint="Of all dancer slots, Mon to Fri" />
            <Kpi
              label="Best day"
              text={a.bestDay?.label ?? "-"}
              hint={a.bestDay ? `${a.bestDay.pct}% free on average` : undefined}
              tone="emerald"
              delay={80}
            />
            <Kpi
              label="Best slot"
              text={a.bestCell ? `${short(a.bestCell.day)} ${a.bestCell.slot}` : "-"}
              hint={a.bestCell ? `${a.bestCell.free} / ${a.bestCell.total} free · ${a.bestCell.pct}%` : undefined}
              tone="amber"
              delay={160}
            />
            <Kpi
              label="Dancers counted"
              value={a.total}
              hint={a.noTimetable ? `${a.noTimetable} without a timetable` : "Everyone has a timetable"}
              tone={a.noTimetable ? "red" : "emerald"}
              delay={240}
            />
          </div>

          {/* Heatmap + who is free */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard
              title="Availability heatmap"
              subtitle="Number of dancers free in each slot. Brighter = more free. Tap a slot to pin it."
              className="lg:col-span-2"
              delay={100}
            >
              <div className="overflow-x-auto" onMouseLeave={() => setHovered(null)}>
                <table className="w-full min-w-[640px] border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-[#0d0c10]/90 px-2 text-left text-[10px] font-semibold uppercase tracking-widest text-orange-100/40">
                        Day
                      </th>
                      {ACTIVE_SLOTS.map((s) => (
                        <th key={s.slot} title={s.time} className="text-center text-[10px] font-semibold text-orange-100/50">
                          {s.slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, di) => (
                      <tr key={day}>
                        <td className="sticky left-0 z-10 bg-[#0d0c10]/90 px-2 text-xs font-medium text-orange-50/80">{short(day)}</td>
                        {ACTIVE_SLOTS.map((s, si) => {
                          const k = cellKey(day, s.slot);
                          const c = byKey.get(k)!;
                          const on = active && cellKey(active.day, active.slot) === k;
                          return (
                            <td key={s.slot} className="p-0">
                              <button
                                type="button"
                                onMouseEnter={() => setHovered(k)}
                                onFocus={() => setHovered(k)}
                                onClick={() => select(c)}
                                title={`${label(c)}\n${c.free} / ${c.total} dancers free\n${c.pct}%`}
                                aria-label={`${label(c)}: ${c.free} of ${c.total} free, ${c.pct}%`}
                                aria-pressed={pinned === k}
                                style={{ backgroundColor: heat(c.pct), animationDelay: `${di * 50 + si * 18}ms` }}
                                className={`heat-pop flex h-10 w-full items-center justify-center rounded-lg text-xs font-semibold tabular-nums outline-none transition-[background-color,transform,box-shadow] duration-500 hover:-translate-y-0.5 hover:scale-105 focus-visible:ring-2 focus-visible:ring-orange-200 ${
                                  c.pct >= 50 ? "text-white" : "text-orange-100/60"
                                } ${on ? "ring-2 ring-amber-200 shadow-[0_0_18px_-4px_rgba(251,191,36,0.8)]" : ""} ${
                                  k === bestKey && !on ? "ring-1 ring-amber-300/60" : ""
                                }`}
                              >
                                {c.free}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-orange-100/50">
                <span>Fewer free</span>
                <div className="h-2 w-32 rounded-full" style={{ background: `linear-gradient(to right, ${heat(0)}, ${heat(100)})` }} />
                <span>All free</span>
                <span className="ml-auto flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded ring-1 ring-amber-300/60" /> Best slot
                </span>
              </div>
            </ChartCard>

            <SlotDetail cell={active} names={names} pinned={!!pinned} isBest={!!active && cellKey(active.day, active.slot) === bestKey} onClear={() => setPinned(null)} />
          </div>

          {/* Day and slot charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Availability by day" subtitle="Average share of the team free across T1 to T12" delay={140}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.byDay.map((d) => ({ name: short(d.day), pct: d.pct, full: d.label }))} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={C.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: C.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Free"]} labelFormatter={(_, p) => p?.[0]?.payload?.full ?? ""} />
                    <Bar dataKey="pct" radius={[8, 8, 0, 0]} {...ANIM}>
                      {a.byDay.map((d) => (
                        <Cell key={d.day} fill={d.day === a.bestDay?.day ? C.orange : "#fbbf24aa"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Availability by slot" subtitle="Average share free in each slot, Monday to Friday" delay={200}>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.bySlot} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={C.grid} vertical={false} />
                    <XAxis dataKey="slot" tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fill: C.axis, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Free"]} labelFormatter={(s, p) => `${s} · ${p?.[0]?.payload?.time ?? ""}`} />
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]} {...ANIM}>
                      {a.bySlot.map((s) => {
                        const max = Math.max(...a.bySlot.map((x) => x.pct));
                        const min = Math.min(...a.bySlot.map((x) => x.pct));
                        return <Cell key={s.slot} fill={s.pct === max ? C.orange : s.pct === min ? C.red : "#fbbf24aa"} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Suggestions and hard slots */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Recommended rehearsal slots" subtitle="The best slot on three different days" delay={160}>
              <ol className="space-y-2">
                {a.suggestions.map((c, i) => (
                  <SlotRow key={cellKey(c.day, c.slot)} cell={c} rank={i + 1} tone="good" onClick={() => select(c)} />
                ))}
              </ol>
            </ChartCard>
            <ChartCard title="Most difficult slots" subtitle="Fewest dancers free. Avoid these for rehearsals." delay={220}>
              {a.difficult.length === 0 && (
                <p className="py-6 text-center text-sm text-orange-100/50">No clashes: every dancer is free in every slot.</p>
              )}
              <ol className="space-y-2">
                {a.difficult.map((c, i) => (
                  <SlotRow key={cellKey(c.day, c.slot)} cell={c} rank={i + 1} tone="bad" onClick={() => select(c)} />
                ))}
              </ol>
            </ChartCard>
          </div>

          {/* Per-dancer */}
          <ChartCard title="Dancer availability ranking" subtitle="Share of the 60 weekly slots each dancer is free" delay={180}>
            <div className="divide-y divide-white/5">
              {a.ranking.map((r, i) => (
                <MeterRow
                  key={r.id}
                  index={i}
                  label={`${i + 1}. ${r.fullName}`}
                  sub={
                    !r.hasTimetable
                      ? "No timetable set"
                      : `${r.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur"}${r.isLead ? " · Team Leader" : ""} · ${r.freeSlots} free slots`
                  }
                  value={r.pct}
                  color={r.hasTimetable ? C.orange : "#52525b"}
                />
              ))}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}

// Right-hand panel: the hovered / pinned slot (or the best slot), with names.
function SlotDetail({
  cell,
  names,
  pinned,
  isBest,
  onClear,
}: {
  cell: AvailabilityCell | null;
  names: Map<string, string>;
  pinned: boolean;
  isBest: boolean;
  onClear: () => void;
}) {
  if (!cell) return null;
  const list = (ids: string[]) => ids.map((id) => names.get(id) ?? "Unknown").sort((x, y) => x.localeCompare(y));
  return (
    <section className="anim-fade-up rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] to-transparent p-5 lg:sticky lg:top-6 lg:self-start" style={{ animationDelay: "160ms" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-200/70">
            {isBest && <Crown size={12} />}
            {pinned ? "Pinned slot" : isBest ? "Best slot" : "Slot"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{label(cell)}</h2>
          <p className="text-xs text-orange-100/50">{cell.time}</p>
        </div>
        {pinned && (
          <button onClick={onClear} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-orange-100/60 hover:text-white">
            Unpin
          </button>
        )}
      </div>

      <p className="mt-4 text-3xl font-bold tabular-nums text-white">
        <CountUp key={`${cell.day}${cell.slot}${cell.free}`} value={cell.free} duration={400} />
        <span className="text-lg font-medium text-orange-100/50"> / {cell.total} free</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500 transition-[width] duration-500" style={{ width: `${cell.pct}%` }} />
      </div>
      <p className="mt-1 text-xs tabular-nums text-orange-100/60">{cell.pct}% availability</p>

      <NameList icon={<CheckCircle2 size={13} className="text-emerald-400" />} title={`Free (${cell.free})`} people={list(cell.freeIds)} chip="border-emerald-400/20 bg-emerald-400/10 text-emerald-100" />
      <NameList icon={<XCircle size={13} className="text-red-400" />} title={`In class (${cell.busyIds.length})`} people={list(cell.busyIds)} chip="border-red-400/20 bg-red-400/10 text-red-100" />
    </section>
  );
}

function NameList({ icon, title, people, chip }: { icon: React.ReactNode; title: string; people: string[]; chip: string }) {
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-orange-100/50">
        {icon}
        {title}
      </p>
      {people.length === 0 ? (
        <p className="mt-1.5 text-xs text-orange-100/40">Nobody</p>
      ) : (
        <div className="mt-1.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {people.map((n) => (
            <span key={n} className={`rounded-full border px-2.5 py-0.5 text-xs ${chip}`}>
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotRow({ cell, rank, tone, onClick }: { cell: AvailabilityCell; rank: number; tone: "good" | "bad"; onClick: () => void }) {
  const good = tone === "good";
  return (
    <li>
      <button
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-white/[0.04]"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            good ? "bg-orange-500/20 text-orange-200" : "bg-red-500/15 text-red-300"
          }`}
        >
          {good ? (rank === 1 ? <Sparkles size={14} /> : rank) : rank === 1 ? <AlertTriangle size={14} /> : rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-white">{label(cell)}</span>
          <span className="flex items-center gap-1 text-[11px] text-orange-100/50">
            <CalendarClock size={11} /> {cell.time}
          </span>
        </span>
        <span className="text-right">
          <span className={`flex items-center justify-end gap-1 text-sm font-semibold tabular-nums ${good ? "text-orange-200" : "text-red-300"}`}>
            <Users size={13} /> {cell.free}/{cell.total}
          </span>
          <span className="text-[11px] tabular-nums text-orange-100/50">{cell.pct}% free</span>
        </span>
      </button>
    </li>
  );
}

// Loading state shaped like the page, so nothing jumps when the data arrives.
function Skeleton() {
  const block = "animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]";
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading availability">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-24`} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${block} h-80 lg:col-span-2`} />
        <div className={`${block} h-80`} />
      </div>
    </div>
  );
}

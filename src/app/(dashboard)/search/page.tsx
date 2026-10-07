"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, SlidersHorizontal, ArrowUpRight, Copy, UserX } from "lucide-react";
import { useToast } from "@/components/ui/feedback";
import { Skeleton, EmptyState } from "@/components/ui/states";
import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";
import {
  CORE_TEAMS,
  MEMBER_TEAMS,
  DANCER_TEAMS,
  DANCER_ROLES,
} from "@/lib/teams";

interface Member {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  department: string;
  academicYear: number;
  category: string;
  isFFCS: boolean;
  position: string | null;
  team: string | null;
  skillLevel: "PROFESSIONAL" | "AMATEUR";
}

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");
const MORNING = ACTIVE_SLOTS.slice(0, 6).map((s) => s.slot);
const AFTERNOON = ACTIVE_SLOTS.slice(6).map((s) => s.slot);

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core";
  if (category === "DANCER") return "Dancer";
  if (category === "FFCS_ONLY") return "FFCS only";
  return "Normal";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-violet-500/15 text-violet-300";
  if (category === "DANCER") return "bg-pink-500/15 text-pink-300";
  if (category === "FFCS_ONLY") return "bg-teal-500/15 text-teal-300";
  return "bg-zinc-500/20 text-zinc-300";
}

const EMPTY_FILTERS = {
  query: "",
  category: "",
  isFFCS: "",
  department: "",
  academicYear: "",
  position: "",
  team: "",
  skillLevel: "",
  day: "",
  selectedSlots: [] as string[],
};

// Shared look for form controls and filter labels in the rail.
const control =
  "w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white placeholder-zinc-600";
const label = "mb-1.5 block text-[11px] font-medium text-zinc-400";
const groupTitle = "text-[10px] font-semibold uppercase tracking-widest text-violet-400";

const chip = (on: boolean) =>
  `rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
    on
      ? "border-violet-400/60 bg-violet-600 text-white"
      : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
  }`;

export default function SearchPage() {
  const toast = useToast();
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<typeof EMPTY_FILTERS | null>(null);
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  // Mobile only: the filter rail collapses after a search so results are visible.
  const [railOpen, setRailOpen] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const day = p.get("day") ?? "";
    const slots = (p.get("slots") ?? "").split(",").filter((s) => ACTIVE_SLOTS.some((a) => a.slot === s));
    if (DAYS.includes(day as (typeof DAYS)[number]) && slots.length > 0) {
      const start = { ...EMPTY_FILTERS, day, selectedSlots: slots };
      setDraft(start);
      runSearch(start);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<typeof EMPTY_FILTERS>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  function toggleSlot(slot: string) {
    setDraft((prev) => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slot)
        ? prev.selectedSlots.filter((s) => s !== slot)
        : [...prev.selectedSlots, slot],
    }));
  }

  const handleSearch = () => runSearch(draft);

  async function runSearch(draft: typeof EMPTY_FILTERS) {
    setLoading(true);
    setSearched(true);
    setApplied({ ...draft });
    setRailOpen(false);

    const params = new URLSearchParams();
    if (draft.query) params.set("query", draft.query);
    if (draft.category) params.set("category", draft.category);
    if (draft.isFFCS) params.set("isFFCS", draft.isFFCS);
    if (draft.department) params.set("department", draft.department);
    if (draft.academicYear) params.set("academicYear", draft.academicYear);
    if (draft.position) params.set("position", draft.position);
    if (draft.team) params.set("team", draft.team);
    if (draft.skillLevel) params.set("skillLevel", draft.skillLevel);
    if (draft.day) params.set("day", draft.day);
    if (draft.selectedSlots.length > 0)
      params.set("slots", draft.selectedSlots.join(","));

    try {
      const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
      setSearched(false);
      setRailOpen(true);
      toast.error("Search did not finish", "Check your connection and press Search again.");
    } finally {
      setLoading(false);
    }
  }

  // Click a filter chip above the results to drop that filter and search again.
  function removeFilter(reset: Partial<typeof EMPTY_FILTERS>) {
    const next = { ...(applied ?? draft), ...reset };
    setDraft(next);
    runSearch(next);
  }

  async function copyNames() {
    const text = results.map((m, i) => `${i + 1}. ${m.fullName} (${m.registerNumber})`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${results.length} name${results.length === 1 ? "" : "s"}`, "Paste them into WhatsApp or a document.");
    } catch {
      toast.error("Could not copy", "Your browser blocked the clipboard.");
    }
  }

  function handleClear() {
    setDraft({ ...EMPTY_FILTERS });
    setApplied(null);
    setResults([]);
    setSearched(false);
    setRailOpen(true);
  }

  // When category changes, reset the category-dependent filters
  function handleCategoryChange(val: string) {
    set({ category: val, position: "", skillLevel: "" }); // dance team applies to every category
  }

  const activeFilterCount =
    [
      draft.query,
      draft.category,
      draft.isFFCS,
      draft.department,
      draft.academicYear,
      draft.position,
      draft.team,
      draft.skillLevel,
      draft.day,
    ].filter(Boolean).length + draft.selectedSlots.length;

  const showPositionFilter = draft.category === "CORE" || draft.category === "MEMBER";
  const showDancerFilters = draft.category === "DANCER";
  const enter = (e: React.KeyboardEvent) => e.key === "Enter" && handleSearch();

  return (
    <div>
      <div data-section="People" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Search</h1>
          <p className="text-zinc-500 mt-0.5">Build your filters, then press Search</p>
        </div>
        <button
          onClick={() => setRailOpen((o) => !o)}
          className="lg:hidden flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
        >
          <SlidersHorizontal size={14} />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
      </div>

      <div className="p-4 sm:p-8 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* ── Filter rail ─────────────────────────────────────────── */}
        <aside
          className={`${railOpen ? "block" : "hidden"} lg:block mb-6 lg:mb-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto overscroll-contain rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-bold text-white">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded bg-violet-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
                  {activeFilterCount}
                </span>
              )}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>

          <div className="space-y-6 p-4">
            {/* Who */}
            <section className="space-y-3">
              <p className={groupTitle}>Who</p>
              <div className="relative">
                <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={draft.query}
                  onChange={(e) => set({ query: e.target.value })}
                  onKeyDown={enter}
                  placeholder="Name or register number"
                  className={`${control} pl-9`}
                />
              </div>

              <div>
                <label className={label}>Category</label>
                <select value={draft.category} onChange={(e) => handleCategoryChange(e.target.value)} className={control}>
                  <option value="">All categories</option>
                  <option value="CORE">Core Members</option>
                  <option value="MEMBER">Normal Members</option>
                  <option value="DANCER">Dancers</option>
                  <option value="FFCS_ONLY">FFCS Only</option>
                </select>
              </div>

              {showPositionFilter && (
                <div>
                  <label className={label}>Position</label>
                  <select value={draft.position} onChange={(e) => set({ position: e.target.value })} className={control}>
                    <option value="">All positions</option>
                    {(draft.category === "CORE" ? CORE_TEAMS : MEMBER_TEAMS).map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Any category can dance in a team (e.g. Core members), so this filter is always available */}
              <div>
                <label className={label}>Dance team</label>
                <select value={draft.team} onChange={(e) => set({ team: e.target.value })} className={control}>
                  <option value="">Any (or none)</option>
                  {DANCER_TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {showDancerFilters && (
                <>
                  <div>
                    <label className={label}>Dancer role</label>
                    <select value={draft.position} onChange={(e) => set({ position: e.target.value })} className={control}>
                      <option value="">All roles</option>
                      {DANCER_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Skill level</label>
                    <div className="flex gap-1.5">
                      {[
                        { v: "", l: "Any" },
                        { v: "PROFESSIONAL", l: "Professional" },
                        { v: "AMATEUR", l: "Amateur" },
                      ].map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => set({ skillLevel: o.v })}
                          className={chip(draft.skillLevel === o.v)}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={label}>Year</label>
                <div className="flex gap-1.5">
                  {["", "1", "2", "3", "4", "5"].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => set({ academicYear: y })}
                      className={chip(draft.academicYear === y)}
                    >
                      {y === "" ? "Any" : `Y${y}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={label}>Department</label>
                <input
                  value={draft.department}
                  onChange={(e) => set({ department: e.target.value })}
                  onKeyDown={enter}
                  placeholder="e.g. CSE"
                  className={control}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={draft.isFFCS === "true"}
                  onChange={(e) => set({ isFFCS: e.target.checked ? "true" : "" })}
                  className="h-4 w-4 accent-violet-500"
                />
                FFCS enrolled only
              </label>
            </section>

            {/* Availability */}
            <section className="space-y-3 border-t border-white/10 pt-5">
              <p className={groupTitle}>Availability</p>
              <div>
                <label className={label}>Day</label>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => set({ day: "" })} className={chip(draft.day === "")}>
                    Any
                  </button>
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set({ day: d })}
                      className={chip(draft.day === d)}
                    >
                      {DAY_LABELS[d].slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={label}>
                  Free during these slots
                  {draft.selectedSlots.length > 0 && (
                    <span className="ml-1 text-violet-300">({draft.selectedSlots.length})</span>
                  )}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ACTIVE_SLOTS.map((s) => (
                    <button
                      key={s.slot}
                      type="button"
                      onClick={() => toggleSlot(s.slot)}
                      title={s.time}
                      className={chip(draft.selectedSlots.includes(s.slot))}
                    >
                      {s.slot}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    { l: "Morning", v: MORNING },
                    { l: "Afternoon", v: AFTERNOON },
                    { l: "Whole day", v: [...MORNING, ...AFTERNOON] },
                  ].map((p) => (
                    <button
                      key={p.l}
                      type="button"
                      onClick={() => set({ selectedSlots: p.v })}
                      className="rounded px-2 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
                    >
                      {p.l}
                    </button>
                  ))}
                  {draft.selectedSlots.length > 0 && (
                    <button
                      type="button"
                      onClick={() => set({ selectedSlots: [] })}
                      className="rounded px-2 py-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-300"
                    >
                      Clear slots
                    </button>
                  )}
                </div>
                {draft.day && draft.selectedSlots.length === 0 && (
                  <p className="mt-2 text-xs text-amber-400">Pick at least one slot to see who is free on {DAY_LABELS[draft.day]}</p>
                )}
                {draft.selectedSlots.length > 0 && !draft.day && (
                  <p className="mt-2 text-xs text-amber-400">
                    Pick a day to filter by slot availability
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Pinned to the bottom of the rail so it is always in reach, however long the filters get */}
          <div className="sticky bottom-0 border-t border-white/10 bg-surface/95 p-4 backdrop-blur">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(124,58,237,0.9)] transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              <SearchIcon size={14} />
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </aside>

        {/* ── Results ─────────────────────────────────────────────── */}
        <section className="min-w-0">
          {applied && searched && !loading && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Active filters</span>
              {(
                [
                  applied.query && { t: `"${applied.query}"`, r: { query: "" } },
                  applied.category && { t: getCategoryLabel(applied.category), r: { category: "", position: "", skillLevel: "" } },
                  applied.isFFCS && { t: "FFCS enrolled", r: { isFFCS: "" } },
                  applied.department && { t: `Dept: ${applied.department}`, r: { department: "" } },
                  applied.academicYear && { t: `Year ${applied.academicYear}`, r: { academicYear: "" } },
                  applied.position && { t: applied.position, r: { position: "" } },
                  applied.team && { t: applied.team, r: { team: "" } },
                  applied.skillLevel && { t: applied.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur", r: { skillLevel: "" } },
                  applied.day && {
                    t: `${DAY_LABELS[applied.day]}${applied.selectedSlots.length > 0 ? ` · ${applied.selectedSlots.join(", ")}` : ""}`,
                    r: { day: "", selectedSlots: [] },
                  },
                ].filter(Boolean) as { t: string; r: Partial<typeof EMPTY_FILTERS> }[]
              ).map((c) => (
                <button
                  key={c.t}
                  type="button"
                  onClick={() => removeFilter(c.r)}
                  aria-label={`Remove filter ${c.t}`}
                  className="group flex items-center gap-1 rounded bg-violet-500/15 px-2 py-1 text-xs text-violet-200 hover:bg-violet-500/25"
                >
                  {c.t}
                  <X size={11} className="text-violet-300/60 group-hover:text-white" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {!searched ? (
            <div className="rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent p-14 text-center">
              <SearchIcon size={28} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">Find members</p>
              <p className="mt-1 text-xs text-zinc-500">
                Set your filters and press Search. Add a day and slots to see who is free.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-2 rounded-xl border border-white/15 p-4" aria-busy="true" aria-label="Searching">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <p className="text-sm font-bold text-white tabular-nums">
                  {results.length} member{results.length !== 1 ? "s" : ""} found
                </p>
                <div className="flex items-center gap-3">
                  {applied?.day && applied.selectedSlots.length > 0 && (
                    <p className="hidden text-xs text-emerald-400 sm:block">
                      Free on {DAY_LABELS[applied.day]} during {applied.selectedSlots.join(", ")}
                    </p>
                  )}
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={copyNames}
                      className="press flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
                    >
                      <Copy size={12} aria-hidden="true" />
                      Copy names
                    </button>
                  )}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    compact
                    icon={UserX}
                    title="No members match"
                    body={
                      applied?.day && applied.selectedSlots.length > 0
                        ? "Nobody is free during every slot you picked. Try fewer slots or another day."
                        : "Remove a filter above, or clear them all and start again."
                    }
                    action={{ label: "Clear all filters", onClick: handleClear }}
                  />
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <table className="hidden w-full md:table">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                        <th className="px-5 py-2.5">Member</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Position / team</th>
                        <th className="px-4 py-2.5">Course</th>
                        <th className="px-5 py-2.5 text-right">
                          <span className="sr-only">Timetable</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {results.map((member) => (
                        <tr key={member.id} className="transition-colors hover:bg-white/[0.03]">
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-semibold text-zinc-300">
                                {member.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{member.fullName}</p>
                                <p className="truncate text-xs text-zinc-500">
                                  <span className="font-mono">{member.registerNumber}</span> · Year {member.academicYear}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${getCategoryStyle(member.category)}`}>
                                {getCategoryLabel(member.category)}
                              </span>
                              {member.isFFCS && member.category !== "FFCS_ONLY" && (
                                <span className="rounded bg-teal-500/15 px-2 py-0.5 text-[11px] font-medium text-teal-300">FFCS</span>
                              )}
                              {member.category === "DANCER" && (
                                <span className="rounded bg-zinc-500/20 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                                  {member.skillLevel === "PROFESSIONAL" ? "Pro" : "Amateur"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {member.position ? (
                              <p className="text-sm text-zinc-300">{member.position}</p>
                            ) : (
                              <p className="text-xs italic text-zinc-600">Not set</p>
                            )}
                            {member.team && <p className="mt-0.5 text-xs text-violet-400">{member.team}</p>}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-zinc-300">{member.department}</td>
                          <td className="px-5 py-2.5 text-right">
                            <Link
                              href={`/timetable/${member.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:border-violet-400/60 hover:text-white"
                            >
                              Timetable
                              <ArrowUpRight size={12} aria-hidden="true" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <div className="divide-y divide-white/5 md:hidden">
                    {results.map((member) => (
                      <div key={member.id} className="px-4 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-semibold text-zinc-300">
                              {member.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{member.fullName}</p>
                              <p className="text-xs text-zinc-500">
                                <span className="font-mono">{member.registerNumber}</span> · {member.department}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/timetable/${member.id}`}
                            className="shrink-0 text-xs text-violet-400 hover:text-violet-300"
                          >
                            View
                          </Link>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${getCategoryStyle(member.category)}`}>
                            {getCategoryLabel(member.category)}
                          </span>
                          {member.isFFCS && member.category !== "FFCS_ONLY" && (
                            <span className="rounded bg-teal-500/15 px-2 py-0.5 text-[11px] font-medium text-teal-300">FFCS</span>
                          )}
                          {member.category === "DANCER" && (
                            <span className="rounded bg-zinc-500/20 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                              {member.skillLevel === "PROFESSIONAL" ? "Pro" : "Amateur"}
                            </span>
                          )}
                          {member.position && <span className="text-xs text-zinc-400">{member.position}</span>}
                          {member.team && <span className="text-xs text-violet-400">{member.team}</span>}
                          <span className="text-xs text-zinc-500">Y{member.academicYear}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, SlidersHorizontal } from "lucide-react";
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
}

const ACTIVE_SLOTS = SLOTS.filter((s) => s.slot !== "Lunch");

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core";
  if (category === "DANCER") return "Dancer";
  if (category === "FFCS_ONLY") return "FFCS Only";
  return "Member";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-purple-500/20 text-purple-400";
  if (category === "DANCER") return "bg-pink-500/20 text-pink-400";
  if (category === "FFCS_ONLY") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

const EMPTY_FILTERS = {
  query: "",
  category: "",
  isFFCS: "",
  department: "",
  academicYear: "",
  position: "",
  team: "",
  day: "",
  selectedSlots: [] as string[],
};

export default function SearchPage() {
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS });
  const [applied, setApplied] = useState<typeof EMPTY_FILTERS | null>(null);
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  function toggleSlot(slot: string) {
    setDraft((prev) => ({
      ...prev,
      selectedSlots: prev.selectedSlots.includes(slot)
        ? prev.selectedSlots.filter((s) => s !== slot)
        : [...prev.selectedSlots, slot],
    }));
  }

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    setApplied({ ...draft });

    const params = new URLSearchParams();
    if (draft.query) params.set("query", draft.query);
    if (draft.category) params.set("category", draft.category);
    if (draft.isFFCS) params.set("isFFCS", draft.isFFCS);
    if (draft.department) params.set("department", draft.department);
    if (draft.academicYear) params.set("academicYear", draft.academicYear);
    if (draft.position) params.set("position", draft.position);
    if (draft.team) params.set("team", draft.team);
    if (draft.day) params.set("day", draft.day);
    if (draft.selectedSlots.length > 0)
      params.set("slots", draft.selectedSlots.join(","));

    const res = await fetch(`/api/search?${params.toString()}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function handleClear() {
    setDraft({ ...EMPTY_FILTERS });
    setApplied(null);
    setResults([]);
    setSearched(false);
  }

  // When category changes, reset position and team
  function handleCategoryChange(val: string) {
    setDraft((prev) => ({
      ...prev,
      category: val,
      position: "",
      team: "",
    }));
  }

  const hasActiveDraft =
    draft.query ||
    draft.category ||
    draft.isFFCS ||
    draft.department ||
    draft.academicYear ||
    draft.position ||
    draft.team ||
    draft.day ||
    draft.selectedSlots.length > 0;

  const activeFilterCount = [
    draft.query,
    draft.category,
    draft.isFFCS,
    draft.department,
    draft.academicYear,
    draft.position,
    draft.team,
    draft.day,
  ].filter(Boolean).length + draft.selectedSlots.length;

  const showPositionFilter =
    draft.category === "CORE" || draft.category === "MEMBER";
  const showDancerFilters = draft.category === "DANCER";

  return (
    <div>

      <div data-section="People" className="c-page-header">
        <h1 className="text-base sm:text-lg font-semibold text-white">Search</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Build your filters then press Search
        </p>
      </div>

      <div className="p-4 sm:p-8">

        {/* Filter Panel */}
        <div className="bg-[#17120f] border border-gray-800 rounded-xl p-4 sm:p-6 mb-6">

          {/* Name search */}
          <div className="relative mb-4">
            <SearchIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={draft.query}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, query: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, register number..."
              className="w-full bg-[#0d0705] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          {/* Row 1: Main filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Category
              </label>
              <select
                value={draft.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">All</option>
                <option value="CORE">Core Members</option>
                <option value="MEMBER">Normal Members</option>
                <option value="DANCER">Dancers</option>
                <option value="FFCS_ONLY">FFCS Only</option>
              </select>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                FFCS
              </label>
              <select
                value={draft.isFFCS}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, isFFCS: e.target.value }))
                }
                className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">All</option>
                <option value="true">FFCS Enrolled</option>
              </select>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Department
              </label>
              <input
                value={draft.department}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, department: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. CSE"
                className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Year
              </label>
              <select
                value={draft.academicYear}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, academicYear: e.target.value }))
                }
                className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">All</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Day
              </label>
              <select
                value={draft.day}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, day: e.target.value }))
                }
                className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">Any day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Row 2: Position filter — CORE or MEMBER only */}
          {showPositionFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                  Position{" "}
                  <span className="text-gray-600 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  value={draft.position}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, position: e.target.value }))
                  }
                  className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="">All positions</option>
                  {(draft.category === "CORE" ? CORE_TEAMS : MEMBER_TEAMS).map(
                    (pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Row 2: Dance Team + Role — DANCER only */}
          {showDancerFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                  Dance Team{" "}
                  <span className="text-gray-600 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  value={draft.team}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, team: e.target.value }))
                  }
                  className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="">All teams</option>
                  {DANCER_TEAMS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                  Dancer Role{" "}
                  <span className="text-gray-600 normal-case font-normal">
                    (optional)
                  </span>
                </label>
                <select
                  value={draft.position}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, position: e.target.value }))
                  }
                  className="w-full bg-[#0d0705] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="">All roles</option>
                  {DANCER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Time slot multi-select */}
          <div className="mb-5">
            <label className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2 block">
              Time Slots{" "}
              {draft.selectedSlots.length > 0 && (
                <span className="text-purple-400">
                  ({draft.selectedSlots.length} selected)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVE_SLOTS.map((s) => {
                const active = draft.selectedSlots.includes(s.slot);
                return (
                  <button
                    key={s.slot}
                    type="button"
                    onClick={() => toggleSlot(s.slot)}
                    title={s.time}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                      active
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-[#0d0705] border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                    }`}
                  >
                    {s.slot}
                  </button>
                );
              })}
            </div>
            {draft.selectedSlots.length > 0 && !draft.day && (
              <p className="text-orange-400 text-xs mt-2">
                Select a day above to filter by slot availability
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <SearchIcon size={14} />
              {loading ? "Searching..." : "Search"}
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveDraft && (
              <button
                onClick={handleClear}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                <X size={14} />
                Clear Filters
              </button>
            )}
          </div>

        </div>

        {/* Applied filter summary */}
        {applied && searched && !loading && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <SlidersHorizontal size={13} className="text-gray-500" />
            <span className="text-gray-500 text-xs">Active filters:</span>
            {applied.query && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                "{applied.query}"
              </span>
            )}
            {applied.category && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                {getCategoryLabel(applied.category)}
              </span>
            )}
            {applied.isFFCS && (
              <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded-md">
                FFCS Enrolled
              </span>
            )}
            {applied.department && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                Dept: {applied.department}
              </span>
            )}
            {applied.academicYear && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                Year {applied.academicYear}
              </span>
            )}
            {applied.position && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                {applied.position}
              </span>
            )}
            {applied.team && (
              <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-md">
                {applied.team}
              </span>
            )}
            {applied.day && (
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                {DAY_LABELS[applied.day]}
                {applied.selectedSlots.length > 0 &&
                  ` · ${applied.selectedSlots.join(", ")}`}
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {!searched ? (
          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-12 text-center">
            <SearchIcon size={28} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Set your filters above and press Search
            </p>
          </div>
        ) : loading ? (
          <div className="bg-[#17120f] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-500 text-sm">Searching...</p>
          </div>
        ) : (
          <div className="bg-[#17120f] border border-gray-800 rounded-xl overflow-hidden">

            <div className="px-4 sm:px-6 py-3 border-b border-gray-800 flex items-center justify-between">
              <p className="text-gray-400 text-xs">
                {results.length} member{results.length !== 1 ? "s" : ""} found
                {applied?.day && applied.selectedSlots.length > 0 && (
                  <span className="text-green-400">
                    {" "}— free on {DAY_LABELS[applied.day]} during{" "}
                    {applied.selectedSlots.join(", ")}
                  </span>
                )}
              </p>
            </div>

            {results.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">
                  No members match your filters.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <table className="hidden md:table w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Name</th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Reg No.</th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Category</th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Position / Team</th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Dept</th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Year</th>
                      <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Timetable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {results.map((member) => (
                      <tr key={member.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-400 text-xs font-semibold">
                                {member.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {member.fullName}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm font-mono">
                            {member.registerNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${getCategoryStyle(member.category)}`}>
                              {getCategoryLabel(member.category)}
                            </span>
                            {member.isFFCS && member.category !== "FFCS_ONLY" && (
                              <span className="text-xs font-medium px-2 py-1 rounded-md bg-teal-500/20 text-teal-400">
                                FFCS
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {member.position ? (
                              <p className="text-gray-300 text-sm">
                                {member.position}
                              </p>
                            ) : (
                              <p className="text-gray-600 text-xs italic">
                                Not set
                              </p>
                            )}
                            {member.team && (
                              <p className="text-purple-400 text-xs mt-0.5">
                                {member.team}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm">
                            {member.department}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm">
                            Y{member.academicYear}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/timetable/${member.id}`}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-800">
                  {results.map((member) => (
                    <div key={member.id} className="px-4 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-400 text-xs font-semibold">
                              {member.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {member.fullName}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {member.registerNumber} · {member.department}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/timetable/${member.id}`}
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0"
                        >
                          View
                        </Link>
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${getCategoryStyle(member.category)}`}>
                          {getCategoryLabel(member.category)}
                        </span>
                        {member.isFFCS && member.category !== "FFCS_ONLY" && (
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-teal-500/20 text-teal-400">
                            FFCS
                          </span>
                        )}
                        {member.position && (
                          <span className="text-gray-400 text-xs">
                            {member.position}
                          </span>
                        )}
                        {member.team && (
                          <span className="text-purple-400 text-xs">
                            {member.team}
                          </span>
                        )}
                        <span className="text-gray-500 text-xs">
                          Y{member.academicYear}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
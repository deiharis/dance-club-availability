"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";
import { SLOTS, DAYS, DAY_LABELS } from "@/lib/timetable";

interface Member {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  department: string;
  academicYear: number;
  category: string;
  position: string;
}

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core Members";
  if (category === "FFCS") return "FFCS";
  return "Normal Members";
}

function getCategoryStyle(category: string) {
  if (category === "CORE") return "bg-purple-500/20 text-purple-400";
  if (category === "FFCS") return "bg-blue-500/20 text-blue-400";
  return "bg-gray-500/20 text-gray-400";
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");

  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category) params.set("category", category);
    if (department) params.set("department", department);
    if (academicYear) params.set("academicYear", academicYear);
    if (day) params.set("day", day);
    if (slot) params.set("slot", slot);

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();

    setResults(data);
    setLoading(false);
  }, [query, category, department, academicYear, day, slot]);

  // Auto search whenever filters change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      runSearch();
    }, 350);
    return () => clearTimeout(timeout);
  }, [runSearch]);

  function clearFilters() {
    setQuery("");
    setCategory("");
    setDepartment("");
    setAcademicYear("");
    setDay("");
    setSlot("");
  }

  const hasActiveFilters =
    query || category || department || academicYear || day || slot;

  return (
    <div>

      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4">
        <h1 className="text-lg font-semibold text-white">Search</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Find members by name, category, department, or availability
        </p>
      </div>

      <div className="p-8">

        {/* Filters */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-6 mb-6">

          {/* Name / Reg Number search */}
          <div className="relative mb-5">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, register number, or position..."
              className="w-full bg-[#0f1117] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">All</option>
                <option value="CORE">Core Members</option>
                <option value="MEMBER">Normal Members</option>
                <option value="FFCS">FFCS</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Department
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE"
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">All</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Day
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">Any day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1.5 block">
                Time Slot
              </label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              >
                <option value="">Any slot</option>
                {SLOTS.filter((s) => s.slot !== "Lunch").map((s) => (
                  <option key={s.slot} value={s.slot}>
                    {s.slot} ({s.time})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs mt-4 transition-colors"
            >
              <X size={12} />
              Clear all filters
            </button>
          )}

        </div>

        {/* Results */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">

          <div className="px-6 py-3 border-b border-gray-800">
            <p className="text-gray-400 text-xs">
              {loading
                ? "Searching..."
                : `${results.length} member${results.length !== 1 ? "s" : ""} found`}
              {day && slot && !loading && (
                <span className="text-green-400">
                  {" "}— available on {DAY_LABELS[day]} during {slot}
                </span>
              )}
            </p>
          </div>

          {!loading && searched && results.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm">
                No members match your search.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Name</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Reg Number</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Category</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Position</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase tracking-wide px-6 py-3">Department</th>
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
                          <p className="text-white text-sm font-medium">{member.fullName}</p>
                          <p className="text-gray-500 text-xs">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm font-mono">{member.registerNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${getCategoryStyle(member.category)}`}>
                        {getCategoryLabel(member.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{member.position}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{member.department}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">Year {member.academicYear}</span>
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
          )}

        </div>

      </div>
    </div>
  );
}
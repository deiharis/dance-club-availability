"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ArrowUpRight, CalendarX2, UserPlus } from "lucide-react";
import { SLOTS, DAYS, SlotStatus } from "@/lib/timetable";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { EmptyState } from "@/components/ui/states";

export type DirectoryMember = {
  id: string;
  fullName: string;
  registerNumber: string;
  department: string;
  position: string | null;
  team: string | null;
  category: string;
  classes: string[]; // "MONDAY_T1" keys of the CLASS slots; anything else is free
};

const TEACHING = SLOTS.filter((s) => s.slot !== "Lunch");
const PAGE = 30;
const CATEGORIES = [
  { v: "", l: "All" },
  { v: "CORE", l: "Core" },
  { v: "MEMBER", l: "Normal" },
  { v: "DANCER", l: "Dancers" },
  { v: "FFCS_ONLY", l: "FFCS only" },
];

// Committee Timetable page: one light row per member (with a tiny week preview) instead of ~300
// full grids at once. Clicking a row opens that member's editable grid in place.
export default function TimetableDirectory({ members, missing }: { members: DirectoryMember[]; missing: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  // Class slots edited on this page, so the row preview and count follow the open grid.
  const [edited, setEdited] = useState<Record<string, string[]>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!category || m.category === category) &&
        (!q || m.fullName.toLowerCase().includes(q) || m.registerNumber.toLowerCase().includes(q) || m.department.toLowerCase().includes(q)),
    );
  }, [members, query, category]);

  if (members.length === 0) {
    return missing ? (
      <EmptyState icon={CalendarX2} title="Everyone has filled in a timetable" body="Nobody is missing. New members will appear here until they add their classes." />
    ) : (
      <EmptyState icon={UserPlus} title="No members yet" body="Add members first, then fill in their timetables here." action={{ label: "Add member", href: "/members/add" }} />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Name, register number or course"
            aria-label="Filter members"
            className="w-full rounded-md border border-zinc-700 bg-black/40 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-600"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c.v}
              type="button"
              aria-pressed={category === c.v}
              onClick={() => {
                setCategory(c.v);
                setShown(PAGE);
              }}
              className={`press rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                category === c.v ? "border-violet-400/60 bg-violet-600 text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {c.l}
            </button>
          ))}
        </div>
        <p className="text-xs tabular-nums text-zinc-500 sm:ml-auto">
          {filtered.length} member{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState compact icon={Search} title="No one matches" body="Try a different name, register number or category." />
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-surface">
          {filtered.slice(0, shown).map((m) => {
            const classes = edited[m.id] ?? m.classes;
            const set = new Set(classes);
            const isOpen = open === m.id;
            return (
              <li key={m.id}>
                <div className={`flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${isOpen ? "bg-violet-500/[0.06]" : "hover:bg-white/[0.03]"}`}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : m.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-zinc-300">
                      {m.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{m.fullName}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        <span className="font-mono">{m.registerNumber}</span> · {m.department}
                        {m.position ? ` · ${m.position}` : ""}
                      </span>
                    </span>
                    {/* Week preview: 5 days x 12 slots, red = class */}
                    <span className="hidden shrink-0 md:block" aria-hidden="true">
                      {DAYS.map((d) => (
                        <span key={d} className="flex gap-px pb-px">
                          {TEACHING.map((s) => (
                            <span key={s.slot} className={`h-1.5 w-2 rounded-[1px] ${set.has(`${d}_${s.slot}`) ? "bg-red-400/70" : "bg-emerald-400/15"}`} />
                          ))}
                        </span>
                      ))}
                    </span>
                    <span className="w-24 shrink-0 text-right">
                      {classes.length === 0 ? (
                        <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">No timetable</span>
                      ) : (
                        <span className="text-xs tabular-nums text-zinc-400">{classes.length} classes</span>
                      )}
                    </span>
                    <ChevronDown size={15} className={`shrink-0 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                </div>
                {isOpen && (
                  <div className="page-enter border-t border-white/5 bg-black/20 px-4 py-4">
                    <TimetableGrid
                      memberId={m.id}
                      initialEntries={classes.map((k) => {
                        const [day, slot] = k.split("_");
                        return { day, slot, status: "CLASS" as SlotStatus };
                      })}
                      onChange={(next) => setEdited((e) => ({ ...e, [m.id]: next }))}
                    />
                    <Link href={`/timetable/${m.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">
                      Open on its own page <ArrowUpRight size={12} aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {filtered.length > shown && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="press rounded-md border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-white/5"
          >
            Show {Math.min(PAGE, filtered.length - shown)} more of {filtered.length - shown}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useToast, useConfirm } from "@/components/ui/feedback";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import ProgrammeIssuesCard from "@/components/members/ProgrammeIssuesCard";
import { Plus, Download, Upload, FileSpreadsheet, Search, Pencil, Trash2, Sparkles, X, ListChecks } from "lucide-react";

interface Member {
  id: string;
  fullName: string;
  registerNumber: string;
  email: string;
  department: string;
  academicYear: number;
  category: string;
  isFFCS: boolean;
  position: string;
  team: string | null;
}

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

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "CORE", label: "Core" },
  { key: "MEMBER", label: "Normal" },
  { key: "DANCER", label: "Dancer" },
  { key: "FFCS_ONLY", label: "FFCS only" },
] as const;

const secondaryBtn =
  "flex items-center gap-1.5 border border-zinc-700 hover:bg-white/5 hover:border-zinc-500 disabled:opacity-50 text-zinc-200 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors";

export default function MembersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    attached?: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");

  // Multi-select delete. The selection is cleared whenever the search or filter changes, so you
  // only ever delete people you can see.
  const [selectMode, setSelectMode] = useState(false); // checkboxes only show after "Select"
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  useEffect(() => setSelected(new Set()), [query, filter]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // "Tidy departments": preview how many spellings would be merged, then apply on request.
  const [tidy, setTidy] = useState<{
    changes: { field: string; from: string; to: string; count: number }[];
    done?: number;
  } | null>(null);
  const [tidyBusy, setTidyBusy] = useState(false);

  async function openTidy() {
    setTidyBusy(true);
    const res = await fetch("/api/members/departments", { cache: "no-store" });
    const data = await res.json();
    setTidyBusy(false);
    setTidy({ changes: res.ok ? data.changes : [] });
  }

  async function applyTidy() {
    setTidyBusy(true);
    const res = await fetch("/api/members/departments", { method: "POST" });
    const data = await res.json();
    setTidyBusy(false);
    if (res.ok) {
      setTidy({ changes: [], done: data.updated });
      loadMembers();
    }
  }

  // Bumped on every reload so the SuperAdmin's "Department data issues" card refreshes too.
  const [reloads, setReloads] = useState(0);

  function loadMembers() {
    setLoading(true);
    setReloads((n) => n + 1);
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/members/import", { method: "POST", body: formData });
    const data = await res.json();
    setImporting(false);
    setImportResult(data);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadMembers();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: members.length };
    for (const m of members) c[m.category] = (c[m.category] ?? 0) + 1;
    return c;
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (filter !== "ALL" && m.category !== filter) return false;
      if (!q) return true;
      return [m.fullName, m.registerNumber, m.email, m.department, m.position, m.team ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, filter]);

  const allShownSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const someShownSelected = filtered.some((m) => selected.has(m.id));
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAllShown = () => setSelected(allShownSelected ? new Set() : new Set(filtered.map((m) => m.id)));

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    // Typed confirmation: this deletes accounts and everything linked to them, and cannot be undone.
    const ok = await confirm({
      title: `Delete ${ids.length} member${ids.length === 1 ? "" : "s"}?`,
      body: "Their accounts are deleted together with their timetables, reports and attendance. The Super Admin and your own account are never deleted. This cannot be undone.",
      confirmLabel: `Delete ${ids.length}`,
      tone: "danger",
      requireText: "DELETE",
    });
    if (!ok) return;
    setDeleting(true);
    setBulkResult(null);
    const res = await fetch("/api/members/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      setBulkResult(data.error || "Something went wrong. Nothing was deleted.");
      return;
    }
    setBulkResult(
      `Deleted ${data.deleted} member${data.deleted === 1 ? "" : "s"}.${
        data.protected ? ` ${data.protected} kept (the Super Admin and your own account are never deleted).` : ""
      }`
    );
    setSelected(new Set());
    setSelectMode(false);
    loadMembers();
  }

  const toggleSelectMode = () => {
    setSelected(new Set());
    setSelectMode((s) => !s);
  };

  return (
    <div>
      {/* Header */}
      <div data-section="People" className="c-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-white">Members</h1>
            <p className="text-zinc-500 mt-0.5 tabular-nums">
              {filtered.length === members.length
                ? `${members.length} total`
                : `${filtered.length} of ${members.length}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className={secondaryBtn}>
              <Upload size={13} />
              {importing ? "Importing..." : "Import"}
            </button>
            <a href="/api/members/export" className={secondaryBtn}>
              <Download size={13} />
              Export
            </a>
            <button onClick={openTidy} disabled={tidyBusy} className={secondaryBtn} title="Standardise department names and phone numbers">
              <Sparkles size={13} />
              <span className="hidden sm:inline">Tidy data</span>
            </button>
            <a href="/api/timetable/export" className={secondaryBtn}>
              <FileSpreadsheet size={13} />
              <span className="hidden sm:inline">Availability</span>
            </a>
            <Link href="/members/add" className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              <Plus size={13} />
              Add member
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8">
        {tidy && (
          <div className="mb-4 rounded-lg border border-violet-400/30 bg-violet-500/[0.06] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">Tidy data</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {tidy.done !== undefined
                    ? `Done. ${tidy.done} member${tidy.done === 1 ? "" : "s"} updated.`
                    : tidy.changes.length === 0
                    ? "Departments and phone numbers already use one standard format."
                    : `${tidy.changes.reduce((s, c) => s + c.count, 0)} members will be updated to a standard format. Nothing changes until you press Apply.`}
                </p>
              </div>
              <button onClick={() => setTidy(null)} className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white" title="Close">
                <X size={15} />
              </button>
            </div>

            {tidy.changes.length > 0 && (
              <>
                <ul className="mt-3 max-h-56 divide-y divide-white/5 overflow-y-auto rounded-md border border-white/10 bg-black/30 text-sm">
                  {tidy.changes.map((c) => (
                    <li key={c.field + c.from} className="flex items-center gap-3 px-3 py-2"><span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-violet-400">{c.field}</span>
                      <span className="min-w-0 flex-1 truncate text-zinc-400 line-through decoration-zinc-600">{c.from.trim() || "(blank)"}</span>
                      <span className="text-zinc-600">to</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-white">{c.to}</span>
                      <span className="text-xs tabular-nums text-zinc-500">{c.count}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={applyTidy}
                  disabled={tidyBusy}
                  className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                >
                  {tidyBusy ? "Applying..." : `Apply ${tidy.changes.length} change${tidy.changes.length === 1 ? "" : "s"}`}
                </button>
              </>
            )}
          </div>
        )}

        <ProgrammeIssuesCard refreshKey={reloads} />

        {importResult && (
          <div className="bg-surface border border-zinc-800 rounded-lg p-4 mb-4">
            <p className="text-white text-sm font-medium mb-1">
              Import complete: {importResult.created} added
              {importResult.attached ? `, ${importResult.attached} existing member${importResult.attached === 1 ? "" : "s"} added to their dance team` : ""},{" "}
              {importResult.skipped} skipped
            </p>
            <div className="max-h-40 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-zinc-500 text-xs">{err}</p>
              ))}
            </div>
            <button onClick={() => setImportResult(null)} className="text-violet-400 hover:text-violet-300 text-xs mt-2 transition-colors">Dismiss</button>
          </div>
        )}

        {/* Toolbar: search and category filters with counts */}
        <div className="mb-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative lg:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, register no, email, department"
              aria-label="Search members"
              className="w-full rounded-lg border border-zinc-700 bg-surface py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-600"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
                    : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
              >
                {f.label}
                <span className="tabular-nums text-zinc-500">{counts[f.key] ?? 0}</span>
              </button>
            ))}
          </div>
          <button
            onClick={toggleSelectMode}
            aria-pressed={selectMode}
            className={`lg:ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectMode
                ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
          >
            <ListChecks size={14} />
            {selectMode ? "Done" : "Select"}
          </button>
        </div>

        {bulkResult && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-surface px-4 py-3">
            <p className="text-sm text-zinc-200">{bulkResult}</p>
            <button onClick={() => setBulkResult(null)} className="text-xs text-violet-400 hover:text-violet-300">Dismiss</button>
          </div>
        )}

        {selectMode && (
          <div className="sticky top-14 z-20 mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-500/30 bg-[#1a1014]/95 px-4 py-2.5 backdrop-blur">
            <p className="text-sm font-medium text-white">
              {selected.size === 0 ? "Tick the members you want to delete" : `${selected.size} selected`}
            </p>
            {!allShownSelected && (
              <button onClick={toggleAllShown} className="text-xs text-violet-300 hover:text-violet-200">
                Select all {filtered.length} shown
              </button>
            )}
            {selected.size > 0 && (
              <button onClick={() => setSelected(new Set())} className="text-xs text-zinc-400 hover:text-white">
                Clear
              </button>
            )}
            <button
              onClick={deleteSelected}
              disabled={deleting || selected.size === 0}
              className="ml-auto flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
            >
              <Trash2 size={13} />
              {deleting ? "Deleting..." : `Delete ${selected.size} selected`}
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center"><p className="text-zinc-500 text-sm">Loading...</p></div>
        ) : members.length === 0 ? (
          <div className="bg-surface border border-zinc-800 rounded-lg p-12 text-center">
            <p className="text-zinc-500 text-sm mb-4">No members yet.</p>
            <Link href="/members/add" className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Add your first member</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-zinc-800 rounded-lg p-12 text-center">
            <p className="text-zinc-500 text-sm">No members match your search.</p>
          </div>
        ) : (
          <>
            {/* Desktop table: dense rows, small-caps header */}
            <div className="hidden md:block bg-surface border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    {selectMode && <th className="w-10 pl-5 py-2.5">
                      <input
                        type="checkbox"
                        aria-label="Select all shown members"
                        checked={allShownSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someShownSelected && !allShownSelected;
                        }}
                        onChange={toggleAllShown}
                        className="h-4 w-4 cursor-pointer accent-violet-500"
                      />
                    </th>}
                    <th className="px-5 py-2.5">Member</th>
                    <th className="px-4 py-2.5">Reg no.</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Position</th>
                    <th className="px-4 py-2.5">Dept</th>
                    <th className="px-4 py-2.5">Year</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {filtered.map((member) => (
                    <tr key={member.id} className={`transition-colors ${selected.has(member.id) ? "bg-red-500/[0.06]" : "hover:bg-white/[0.02]"}`}>
                      {selectMode && <td className="w-10 pl-5 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Select ${member.fullName}`}
                          checked={selected.has(member.id)}
                          onChange={() => toggleOne(member.id)}
                          className="h-4 w-4 cursor-pointer accent-violet-500"
                        />
                      </td>}
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{member.fullName}</p>
                            <p className="text-zinc-500 text-xs truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><span className="text-zinc-300 text-xs font-mono">{member.registerNumber}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${getCategoryStyle(member.category)}`}>{getCategoryLabel(member.category)}</span>
                          {member.isFFCS && member.category !== "FFCS_ONLY" && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/15 text-teal-300">FFCS</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-zinc-300 text-sm">{member.position}</span>
                        {member.team && <p className="text-violet-400 text-xs mt-0.5">{member.team}</p>}
                      </td>
                      <td className="px-4 py-2.5"><span className="text-zinc-300 text-sm">{member.department}</span></td>
                      <td className="px-4 py-2.5"><span className="text-zinc-300 text-sm tabular-nums">Y{member.academicYear}</span></td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/members/${member.id}/edit`} title="Edit" className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-violet-300 transition-colors">
                            <Pencil size={14} />
                          </Link>
                          <Link href={`/members/${member.id}/delete`} title="Delete" className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((member) => (
                <div key={member.id} className={`bg-surface border rounded-lg p-4 ${selected.has(member.id) ? "border-red-500/40" : "border-zinc-800"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectMode && (
                        <input
                          type="checkbox"
                          aria-label={`Select ${member.fullName}`}
                          checked={selected.has(member.id)}
                          onChange={() => toggleOne(member.id)}
                          className="h-4 w-4 shrink-0 cursor-pointer accent-violet-500"
                        />
                      )}
                      <div className="w-9 h-9 rounded bg-zinc-800 text-zinc-300 text-sm font-semibold flex items-center justify-center shrink-0">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{member.fullName}</p>
                        <p className="text-zinc-500 text-xs truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <Link href={`/members/${member.id}/edit`} title="Edit" className="rounded p-2 text-zinc-500 hover:text-violet-300">
                        <Pencil size={15} />
                      </Link>
                      <Link href={`/members/${member.id}/delete`} title="Delete" className="rounded p-2 text-zinc-500 hover:text-red-400">
                        <Trash2 size={15} />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500">Reg no: </span>
                      <span className="text-zinc-300 font-mono">{member.registerNumber}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Year: </span>
                      <span className="text-zinc-300">Y{member.academicYear}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Dept: </span>
                      <span className="text-zinc-300">{member.department}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Position: </span>
                      <span className="text-zinc-300">{member.position}</span>
                      {member.team && <p className="text-violet-400 text-xs mt-0.5">{member.team}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${getCategoryStyle(member.category)}`}>{getCategoryLabel(member.category)}</span>
                    {member.isFFCS && member.category !== "FFCS_ONLY" && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/15 text-teal-300">FFCS</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Download, Upload, FileSpreadsheet, Search, Pencil, Trash2 } from "lucide-react";

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
  if (category === "CORE") return "bg-sky-500/15 text-sky-300";
  if (category === "DANCER") return "bg-pink-500/15 text-pink-300";
  if (category === "FFCS_ONLY") return "bg-teal-500/15 text-teal-300";
  return "bg-stone-500/20 text-stone-300";
}

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "CORE", label: "Core" },
  { key: "MEMBER", label: "Normal" },
  { key: "DANCER", label: "Dancer" },
  { key: "FFCS_ONLY", label: "FFCS only" },
] as const;

const secondaryBtn =
  "flex items-center gap-1.5 border border-stone-700 hover:bg-white/5 hover:border-stone-500 disabled:opacity-50 text-stone-200 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadMembers() {
    setLoading(true);
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

  return (
    <div>
      {/* Header */}
      <div data-section="People" className="c-page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-white">Members</h1>
            <p className="text-stone-500 mt-0.5 tabular-nums">
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
            <a href="/api/timetable/export" className={secondaryBtn}>
              <FileSpreadsheet size={13} />
              <span className="hidden sm:inline">Availability</span>
            </a>
            <Link href="/members/add" className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-stone-950 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors">
              <Plus size={13} />
              Add member
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8">
        {importResult && (
          <div className="bg-[#17120f] border border-stone-800 rounded-lg p-4 mb-4">
            <p className="text-white text-sm font-medium mb-1">
              Import complete: {importResult.created} added, {importResult.skipped} skipped
            </p>
            {importResult.errors.slice(0, 5).map((err, i) => (
              <p key={i} className="text-stone-500 text-xs">{err}</p>
            ))}
            <button onClick={() => setImportResult(null)} className="text-sky-400 hover:text-sky-300 text-xs mt-2 transition-colors">Dismiss</button>
          </div>
        )}

        {/* Toolbar: search and category filters with counts */}
        <div className="mb-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative lg:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, register no, email, department"
              className="w-full rounded-lg border border-stone-700 bg-[#17120f] py-2 pl-9 pr-3 text-sm text-white placeholder-stone-600"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
                    : "border-stone-800 text-stone-400 hover:text-white hover:border-stone-600"
                }`}
              >
                {f.label}
                <span className="tabular-nums text-stone-500">{counts[f.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center"><p className="text-stone-500 text-sm">Loading...</p></div>
        ) : members.length === 0 ? (
          <div className="bg-[#17120f] border border-stone-800 rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm mb-4">No members yet.</p>
            <Link href="/members/add" className="bg-sky-500 hover:bg-sky-400 text-stone-950 text-sm font-medium px-4 py-2 rounded-lg transition-colors">Add your first member</Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#17120f] border border-stone-800 rounded-lg p-12 text-center">
            <p className="text-stone-500 text-sm">No members match your search.</p>
          </div>
        ) : (
          <>
            {/* Desktop table: dense rows, small-caps header */}
            <div className="hidden md:block bg-[#17120f] border border-stone-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/40 text-left text-[10px] font-semibold uppercase tracking-widest text-stone-500">
                    <th className="px-5 py-2.5">Member</th>
                    <th className="px-4 py-2.5">Reg no.</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Position</th>
                    <th className="px-4 py-2.5">Dept</th>
                    <th className="px-4 py-2.5">Year</th>
                    <th className="px-5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70">
                  {filtered.map((member) => (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-800 text-stone-300 text-xs font-semibold flex items-center justify-center shrink-0">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{member.fullName}</p>
                            <p className="text-stone-500 text-xs truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><span className="text-stone-300 text-xs font-mono">{member.registerNumber}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${getCategoryStyle(member.category)}`}>{getCategoryLabel(member.category)}</span>
                          {member.isFFCS && member.category !== "FFCS_ONLY" && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/15 text-teal-300">FFCS</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-stone-300 text-sm">{member.position}</span>
                        {member.team && <p className="text-sky-400 text-xs mt-0.5">{member.team}</p>}
                      </td>
                      <td className="px-4 py-2.5"><span className="text-stone-300 text-sm">{member.department}</span></td>
                      <td className="px-4 py-2.5"><span className="text-stone-300 text-sm tabular-nums">Y{member.academicYear}</span></td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/members/${member.id}/edit`} title="Edit" className="rounded p-1.5 text-stone-500 hover:bg-white/5 hover:text-sky-300 transition-colors">
                            <Pencil size={14} />
                          </Link>
                          <Link href={`/members/${member.id}/delete`} title="Delete" className="rounded p-1.5 text-stone-500 hover:bg-white/5 hover:text-red-400 transition-colors">
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
                <div key={member.id} className="bg-[#17120f] border border-stone-800 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded bg-stone-800 text-stone-300 text-sm font-semibold flex items-center justify-center shrink-0">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{member.fullName}</p>
                        <p className="text-stone-500 text-xs truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <Link href={`/members/${member.id}/edit`} title="Edit" className="rounded p-2 text-stone-500 hover:text-sky-300">
                        <Pencil size={15} />
                      </Link>
                      <Link href={`/members/${member.id}/delete`} title="Delete" className="rounded p-2 text-stone-500 hover:text-red-400">
                        <Trash2 size={15} />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-stone-500">Reg no: </span>
                      <span className="text-stone-300 font-mono">{member.registerNumber}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Year: </span>
                      <span className="text-stone-300">Y{member.academicYear}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Dept: </span>
                      <span className="text-stone-300">{member.department}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Position: </span>
                      <span className="text-stone-300">{member.position}</span>
                      {member.team && <p className="text-sky-400 text-xs mt-0.5">{member.team}</p>}
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

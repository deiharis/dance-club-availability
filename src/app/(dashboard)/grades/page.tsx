"use client";

import { useToast, useConfirm } from "@/components/ui/feedback";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, GraduationCap, X, Check, Search } from "lucide-react";
import { panel, control, controlLabel, sectionTitle, Avatar } from "@/components/console/ui";

const GRADE_VALUES = ["S", "A", "B", "C", "D", "E"] as const;
type GradeValue = typeof GRADE_VALUES[number];

function gradeColor(grade: string) {
  if (grade === "S") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (grade === "A") return "bg-green-500/20 text-green-300 border-green-500/30";
  if (grade === "B") return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  if (grade === "C") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  if (grade === "D") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core";
  if (category === "DANCER") return "Dancer";
  if (category === "FFCS_ONLY") return "FFCS only";
  return "Normal";
}

interface Grade {
  id: string;
  subject: string;
  grade: GradeValue;
  remarks: string | null;
  createdAt: string;
}

interface Member {
  id: string;
  fullName: string;
  registerNumber: string;
  department: string;
  academicYear: number;
  category: string;
  position: string;
  ffcsGrades: Grade[];
}

// Grade picker: S A B C D E buttons.
function GradePicker({ value, onChange }: { value: GradeValue; onChange: (g: GradeValue) => void }) {
  return (
    <div className="flex gap-1.5">
      {GRADE_VALUES.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          className={`flex-1 rounded-md border py-2 text-xs font-bold transition-colors ${
            value === g ? gradeColor(g) : "border-zinc-700 bg-black/30 text-zinc-500 hover:border-zinc-500"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

// "S x2  A x3" summary chips for a member's grades.
function Distribution({ grades }: { grades: Grade[] }) {
  const counts = GRADE_VALUES.map((g) => [g, grades.filter((x) => x.grade === g).length] as const).filter(
    ([, n]) => n > 0
  );
  if (counts.length === 0) return <span className="text-[11px] text-zinc-600">No grades yet</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {counts.map(([g, n]) => (
        <span key={g} className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${gradeColor(g)}`}>
          {g}
          <span className="font-medium opacity-70"> x{n}</span>
        </span>
      ))}
    </span>
  );
}

export default function GradesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [newGrade, setNewGrade] = useState({ subject: "", grade: "S" as GradeValue, remarks: "" });
  const [addLoading, setAddLoading] = useState(false);

  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", grade: "S" as GradeValue, remarks: "" });
  const [editLoading, setEditLoading] = useState(false);

  function loadMembers() {
    setLoading(true);
    fetch("/api/grades", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? members.filter((m) => `${m.fullName} ${m.registerNumber}`.toLowerCase().includes(q))
      : members;
  }, [members, query]);

  // Keep a valid selection: default to the first member in the list.
  const selected = members.find((m) => m.id === selectedId) ?? filtered[0] ?? members[0] ?? null;

  function select(id: string) {
    setSelectedId(id);
    setEditingGrade(null);
    setNewGrade({ subject: "", grade: "S", remarks: "" });
    setError("");
  }

  async function handleAddGrade() {
    if (!selected) return;
    if (!newGrade.subject.trim()) {
      setError("Subject is required");
      return;
    }
    setAddLoading(true);
    setError("");

    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selected.id, ...newGrade }),
    });
    const data = await res.json();
    setAddLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to add grade");
      return;
    }
    setNewGrade({ subject: "", grade: "S", remarks: "" });
    loadMembers();
  }

  async function handleEditGrade() {
    if (!editingGrade) return;
    if (!editForm.subject.trim()) {
      setError("Subject is required");
      return;
    }
    setEditLoading(true);
    setError("");

    const res = await fetch(`/api/grades/${editingGrade.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setEditLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to update grade");
      return;
    }
    setEditingGrade(null);
    loadMembers();
  }

  async function handleDeleteGrade(gradeId: string) {
    const ok = await confirm({
      title: "Delete this grade?",
      body: "The grade entry is removed from this member's FFCS record. This cannot be undone.",
      confirmLabel: "Delete grade",
      tone: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/grades/${gradeId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not delete the grade", (await res.json().catch(() => ({}))).error);
    toast.success("Grade deleted");
    loadMembers();
  }

  function startEdit(grade: Grade) {
    setEditingGrade(grade);
    setEditForm({ subject: grade.subject, grade: grade.grade, remarks: grade.remarks ?? "" });
    setError("");
  }

  return (
    <div>
      <div data-section="Super admin" className="c-page-header">
        <h1 className="text-white">FFCS grades</h1>
        <p className="text-zinc-500 mt-0.5">Record grades for FFCS-enrolled members</p>
      </div>

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-zinc-500">Loading FFCS members...</p>
        ) : members.length === 0 || !selected ? (
          <div className={`${panel} p-14 text-center`}>
            <GraduationCap size={32} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400">No FFCS-enrolled members found.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Add members with FFCS enabled to manage their grades here.
            </p>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
            {/* ── Left: member list ─────────────────────────────── */}
            <aside className="mb-6 lg:mb-0">
              {/* Phone: a simple picker */}
              <select
                value={selected.id}
                onChange={(e) => select(e.target.value)}
                className={`${control} lg:hidden`}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.registerNumber})
                  </option>
                ))}
              </select>

              {/* Desktop: searchable list */}
              <div className={`${panel} hidden overflow-hidden lg:block`}>
                <div className="border-b border-white/10 p-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search members"
                      className={`${control} pl-9`}
                    />
                  </div>
                </div>
                <ul className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
                  {filtered.map((m) => {
                    const on = m.id === selected.id;
                    return (
                      <li key={m.id}>
                        <button
                          onClick={() => select(m.id)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            on ? "border-l-2 border-l-violet-400 bg-violet-500/10" : "border-l-2 border-l-transparent hover:bg-white/[0.03]"
                          }`}
                        >
                          <p className={`truncate text-sm font-semibold ${on ? "text-white" : "text-zinc-200"}`}>
                            {m.fullName}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-500">{m.registerNumber}</p>
                          <div className="mt-1.5">
                            <Distribution grades={m.ffcsGrades} />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  {filtered.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-zinc-500">No members match.</li>
                  )}
                </ul>
              </div>
            </aside>

            {/* ── Right: selected member ───────────────────────── */}
            <section className="min-w-0 space-y-6">
              <div className={`${panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar name={selected.fullName} size={12} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">{selected.fullName}</p>
                    <p className="text-xs text-zinc-500">
                      <span className="font-mono">{selected.registerNumber}</span> · {selected.department} · Year{" "}
                      {selected.academicYear} · {getCategoryLabel(selected.category)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-white">{selected.ffcsGrades.length}</p>
                  <p className="text-[11px] text-zinc-500">grade{selected.ffcsGrades.length === 1 ? "" : "s"} recorded</p>
                </div>
              </div>

              {/* Grades */}
              <div className={`${panel} overflow-hidden`}>
                <header className="border-b border-white/10 px-5 py-3">
                  <h2 className={sectionTitle}>Grades</h2>
                </header>
                {selected.ffcsGrades.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-zinc-500">No grades recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {selected.ffcsGrades.map((grade) => (
                      <li key={grade.id} className="px-5 py-3">
                        {editingGrade?.id === grade.id ? (
                          <div className="grid gap-3 md:grid-cols-3">
                            <input
                              value={editForm.subject}
                              onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                              className={control}
                            />
                            <GradePicker value={editForm.grade} onChange={(g) => setEditForm({ ...editForm, grade: g })} />
                            <input
                              value={editForm.remarks}
                              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                              placeholder="Remarks"
                              className={control}
                            />
                            <div className="flex gap-2 md:col-span-3">
                              <button
                                onClick={handleEditGrade}
                                disabled={editLoading}
                                className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                              >
                                <Check size={12} />
                                {editLoading ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingGrade(null)}
                                className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/5"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-4">
                              <span className={`w-9 shrink-0 rounded-md border py-1 text-center text-sm font-bold ${gradeColor(grade.grade)}`}>
                                {grade.grade}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{grade.subject}</p>
                                {grade.remarks && <p className="truncate text-xs text-zinc-500">{grade.remarks}</p>}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() => startEdit(grade)}
                                className="rounded p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-violet-300"
                                title="Edit grade"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(grade.id)}
                                className="rounded p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-red-400"
                                title="Delete grade"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add grade: always open */}
              <div className={`${panel} p-5`}>
                <h2 className={sectionTitle}>Add a grade</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={controlLabel}>Subject</label>
                    <input
                      value={newGrade.subject}
                      onChange={(e) => setNewGrade({ ...newGrade, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      className={control}
                    />
                  </div>
                  <div>
                    <label className={controlLabel}>Grade</label>
                    <GradePicker value={newGrade.grade} onChange={(g) => setNewGrade({ ...newGrade, grade: g })} />
                  </div>
                  <div>
                    <label className={controlLabel}>Remarks (optional)</label>
                    <input
                      value={newGrade.remarks}
                      onChange={(e) => setNewGrade({ ...newGrade, remarks: e.target.value })}
                      placeholder="Optional note"
                      className={control}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddGrade}
                  disabled={addLoading}
                  className="mt-4 flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(124,58,237,0.9)] transition-colors hover:bg-violet-500 disabled:opacity-50"
                >
                  <Plus size={14} />
                  {addLoading ? "Saving..." : "Save grade"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

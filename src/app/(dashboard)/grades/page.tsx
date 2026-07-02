"use client";

import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, GraduationCap, X, Check } from "lucide-react";

const GRADE_VALUES = ["S", "A", "B", "C", "D", "E"] as const;
type GradeValue = typeof GRADE_VALUES[number];

function gradeColor(grade: string) {
  if (grade === "S") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (grade === "A") return "bg-green-500/20 text-green-400 border-green-500/30";
  if (grade === "B") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (grade === "C") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  if (grade === "D") return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function getCategoryLabel(category: string) {
  if (category === "CORE") return "Core";
  if (category === "DANCER") return "Dancer";
  if (category === "FFCS_ONLY") return "FFCS Only";
  return "Member";
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

export default function GradesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add grade form state
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newGrade, setNewGrade] = useState({
    subject: "",
    grade: "S" as GradeValue,
    remarks: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Edit grade state
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editForm, setEditForm] = useState({
    subject: "",
    grade: "S" as GradeValue,
    remarks: "",
  });
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

  async function handleAddGrade(memberId: string) {
    if (!newGrade.subject.trim()) {
      setError("Subject is required");
      return;
    }

    setAddLoading(true);
    setError("");

    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...newGrade }),
    });

    const data = await res.json();
    setAddLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to add grade");
      return;
    }

    setAddingFor(null);
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
    if (!confirm("Delete this grade entry?")) return;

    const res = await fetch(`/api/grades/${gradeId}`, { method: "DELETE" });
    if (res.ok) {
      loadMembers();
    }
  }

  function startEdit(grade: Grade) {
    setEditingGrade(grade);
    setEditForm({
      subject: grade.subject,
      grade: grade.grade,
      remarks: grade.remarks ?? "",
    });
    setError("");
  }

  return (
    <div>

      <div className="border-b border-gray-800 bg-[#1a1d27] px-8 py-4">
        <div className="flex items-center gap-3">
          <GraduationCap size={20} className="text-purple-400" />
          <div>
            <h1 className="text-lg font-semibold text-white">FFCS Grades</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Manage grades for FFCS-enrolled members
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">Loading FFCS members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-12 text-center">
            <GraduationCap size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No FFCS-enrolled members found.
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Add members with FFCS enabled to manage their grades here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden"
              >

                {/* Member Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-600/20 border border-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 text-sm font-semibold">
                        {member.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">
                          {member.fullName}
                        </p>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/20">
                          FFCS
                        </span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400">
                          {getCategoryLabel(member.category)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {member.registerNumber} · {member.department} · Year {member.academicYear}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAddingFor(
                        addingFor === member.id ? null : member.id
                      );
                      setNewGrade({ subject: "", grade: "S", remarks: "" });
                      setError("");
                    }}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={13} />
                    Add Grade
                  </button>
                </div>

                {/* Add Grade Form */}
                {addingFor === member.id && (
                  <div className="px-6 py-4 bg-[#0f1117] border-b border-gray-800">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-3">
                      New Grade Entry
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">
                          Subject
                        </label>
                        <input
                          value={newGrade.subject}
                          onChange={(e) =>
                            setNewGrade({ ...newGrade, subject: e.target.value })
                          }
                          placeholder="e.g. Mathematics"
                          className="w-full bg-[#1a1d27] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">
                          Grade
                        </label>
                        <div className="flex gap-1.5">
                          {GRADE_VALUES.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() =>
                                setNewGrade({ ...newGrade, grade: g })
                              }
                              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                newGrade.grade === g
                                  ? gradeColor(g)
                                  : "bg-[#1a1d27] border-gray-700 text-gray-500 hover:border-gray-600"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">
                          Remarks (optional)
                        </label>
                        <input
                          value={newGrade.remarks}
                          onChange={(e) =>
                            setNewGrade({ ...newGrade, remarks: e.target.value })
                          }
                          placeholder="Optional note"
                          className="w-full bg-[#1a1d27] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddGrade(member.id)}
                        disabled={addLoading}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        <Check size={13} />
                        {addLoading ? "Saving..." : "Save Grade"}
                      </button>
                      <button
                        onClick={() => setAddingFor(null)}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        <X size={13} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Grades Table */}
                {member.ffcsGrades.length === 0 ? (
                  <div className="px-6 py-6 text-center">
                    <p className="text-gray-600 text-sm">
                      No grades recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/50">
                    {member.ffcsGrades.map((grade) => (
                      <div key={grade.id} className="px-6 py-3">
                        {editingGrade?.id === grade.id ? (
                          // Edit form inline
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <input
                                value={editForm.subject}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, subject: e.target.value })
                                }
                                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                              />
                            </div>
                            <div className="flex gap-1.5">
                              {GRADE_VALUES.map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() =>
                                    setEditForm({ ...editForm, grade: g })
                                  }
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                                    editForm.grade === g
                                      ? gradeColor(g)
                                      : "bg-[#0f1117] border-gray-700 text-gray-500 hover:border-gray-600"
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                            <div>
                              <input
                                value={editForm.remarks}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, remarks: e.target.value })
                                }
                                placeholder="Remarks"
                                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                              />
                            </div>
                            <div className="flex gap-2 md:col-span-3">
                              <button
                                onClick={handleEditGrade}
                                disabled={editLoading}
                                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Check size={12} />
                                {editLoading ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={() => setEditingGrade(null)}
                                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display row
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${gradeColor(grade.grade)}`}>
                                {grade.grade}
                              </span>
                              <div>
                                <p className="text-white text-sm">{grade.subject}</p>
                                {grade.remarks && (
                                  <p className="text-gray-500 text-xs mt-0.5">
                                    {grade.remarks}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(grade)}
                                className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                                title="Edit grade"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(grade.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                title="Delete grade"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
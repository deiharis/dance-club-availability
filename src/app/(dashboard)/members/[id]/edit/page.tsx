"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import TeamSelector from "@/components/ui/TeamSelector";
import { getTeamsForCategory, DANCER_ROLES } from "@/lib/teams";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    registerNumber: "",
    email: "",
    phone: "",
    department: "",
    academicYear: "1",
    category: "MEMBER",
    isFFCS: false,
    position: "",
    team: "",
  });

  useEffect(() => {
    fetch(`/api/members/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          fullName: data.fullName ?? "",
          registerNumber: data.registerNumber ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          department: data.department ?? "",
          academicYear: String(data.academicYear ?? "1"),
          category: data.category ?? "MEMBER",
          isFFCS: data.isFFCS ?? false,
          position: data.position ?? "",
          team: data.team ?? "",
        });
        setFetching(false);
      })
      .catch(() => {
        setError("Failed to load member data");
        setFetching(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalIsFFCS =
      form.category === "FFCS_ONLY" ? true : form.isFFCS;

    const res = await fetch(`/api/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isFFCS: finalIsFFCS }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/members");
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading member data...</p>
      </div>
    );
  }

  const isFFCSOnly = form.category === "FFCS_ONLY";
  const isDancer = form.category === "DANCER";
  const isCoreOrMember =
    form.category === "CORE" || form.category === "MEMBER";
  const positionOptions = getTeamsForCategory(form.category);

  return (
    <div>
      <div className="border-b border-gray-800 bg-[#1a1d27] px-4 sm:px-8 py-4 flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-semibold text-white">
          Edit Member
        </h1>
        <Link
          href="/members"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Back to Members
        </Link>
      </div>

      <div className="p-4 sm:p-8 max-w-2xl">
        <div className="bg-[#1a1d27] border border-gray-800 rounded-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Full Name
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Register Number
              </label>
              <input
                name="registerNumber"
                value={form.registerNumber}
                onChange={(e) =>
                  setForm({ ...form, registerNumber: e.target.value })
                }
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Phone Number{" "}
                <span className="text-gray-600 normal-case font-normal">
                  (optional)
                </span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                Department
              </label>
              <input
                name="department"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                required
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                  Academic Year
                </label>
                <select
                  value={form.academicYear}
                  onChange={(e) =>
                    setForm({ ...form, academicYear: e.target.value })
                  }
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                      isFFCS:
                        e.target.value === "FFCS_ONLY" ? true : prev.isFFCS,
                      position: "",
                      team: "",
                    }));
                  }}
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="MEMBER">Normal Member</option>
                  <option value="CORE">Core Member</option>
                  <option value="DANCER">Dancer</option>
                  <option value="FFCS_ONLY">FFCS Only</option>
                </select>
              </div>
            </div>

            {/* CORE / MEMBER: position from their team list */}
            {isCoreOrMember && (
              <div>
                <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                  Position{" "}
                  <span className="text-red-400 normal-case font-normal">
                    (required)
                  </span>
                </label>
                <select
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  required
                  className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 transition-colors text-sm"
                >
                  <option value="">Select a position...</option>
                  {positionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DANCER: dance team + role */}
            {isDancer && (
              <>
                <TeamSelector
                  category="DANCER"
                  value={form.team}
                  onChange={(team) => setForm({ ...form, team })}
                />
                <div>
                  <label className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2 block">
                    Dancer Role{" "}
                    <span className="text-red-400 normal-case font-normal">
                      (required)
                    </span>
                  </label>
                  <div className="bg-[#0f1117] border border-gray-700 rounded-lg p-3 space-y-1.5">
                    {DANCER_ROLES.map((role) => (
                      <label
                        key={role}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          form.position === role
                            ? "bg-purple-600/20 border border-purple-500/30"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <input
                          type="radio"
                          name="position"
                          value={role}
                          checked={form.position === role}
                          onChange={(e) =>
                            setForm({ ...form, position: e.target.value })
                          }
                          className="w-4 h-4 accent-purple-500 flex-shrink-0"
                          required
                        />
                        <div>
                          <span className="text-white text-sm">{role}</span>
                          {role === "Team Leader" && (
                            <span className="ml-2 text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              Admin access
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* FFCS Checkbox */}
            <div className="flex items-center gap-3 bg-[#0f1117] border border-gray-700 rounded-lg px-4 py-3">
              <input
                type="checkbox"
                name="isFFCS"
                id="isFFCS"
                checked={isFFCSOnly ? true : form.isFFCS}
                disabled={isFFCSOnly}
                onChange={(e) =>
                  setForm({ ...form, isFFCS: e.target.checked })
                }
                className="w-4 h-4 accent-purple-500"
              />
              <label htmlFor="isFFCS" className="text-sm text-gray-300">
                Enrolled in FFCS programme
              </label>
              {isFFCSOnly && (
                <span className="text-xs text-purple-400 ml-auto">
                  Auto-set for FFCS Only
                </span>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/members"
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm text-center"
              >
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
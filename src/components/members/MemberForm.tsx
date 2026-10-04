"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, User, KeyRound } from "lucide-react";
import TeamSelector from "@/components/ui/TeamSelector";
import { getTeamsForCategory, DANCER_ROLES } from "@/lib/teams";
import { normalizeDepartment, DEPARTMENT_SUGGESTIONS } from "@/lib/departments";
import { normalizePhone } from "@/lib/phone";

export type MemberFormState = {
  fullName: string;
  registerNumber: string;
  email: string;
  phone: string;
  department: string;
  academicYear: string;
  category: string;
  isFFCS: boolean;
  position: string;
  team: string;
  password?: string;
};

const CATEGORIES = [
  { v: "MEMBER", l: "Normal Member" },
  { v: "CORE", l: "Core Member" },
  { v: "DANCER", l: "Dancer" },
  { v: "FFCS_ONLY", l: "FFCS Only" },
];

const control =
  "w-full rounded-md border border-zinc-700 bg-black/40 px-3 py-2.5 text-sm text-white placeholder-zinc-600";
const label = "mb-1.5 block text-[11px] font-medium text-zinc-400";
const panel = "rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent";
const panelTitle = "text-[10px] font-semibold uppercase tracking-widest text-violet-400";

// Same rule the server applies when it picks the login role.
function accessFor(category: string, position: string) {
  if (category === "CORE") return { admin: true, text: "Admin: Working Committee console" };
  if (category === "DANCER" && position === "Team Leader")
    return { admin: true, text: "Admin: Dance Floor, own team only" };
  return { admin: false, text: "Member" };
}

export default function MemberForm({
  mode,
  form,
  setForm,
  onSubmit,
  loading,
  error,
}: {
  mode: "add" | "edit";
  form: MemberFormState;
  setForm: React.Dispatch<React.SetStateAction<MemberFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}) {
  const set = (patch: Partial<MemberFormState>) => setForm((f) => ({ ...f, ...patch }));
  const text =
    (name: keyof MemberFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set({ [name]: e.target.value } as Partial<MemberFormState>);

  const isFFCSOnly = form.category === "FFCS_ONLY";
  const isDancer = form.category === "DANCER";
  const isCoreOrMember = form.category === "CORE" || form.category === "MEMBER";
  const access = accessFor(form.category, form.position);
  const initials =
    form.fullName
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const categoryLabel = CATEGORIES.find((c) => c.v === form.category)?.l ?? "";

  return (
    <form onSubmit={onSubmit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
      {/* ── Left: three panels ─────────────────────────────────── */}
      <div className="space-y-6">
        {/* Identity */}
        <section className={`${panel} p-5 sm:p-6`}>
          <p className={panelTitle}>Identity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Full name</label>
              <input name="fullName" value={form.fullName} onChange={text("fullName")} required placeholder="John Doe" className={control} />
            </div>
            <div>
              <label className={label}>Register number</label>
              <input name="registerNumber" value={form.registerNumber} onChange={(e) => set({ registerNumber: e.target.value.toUpperCase() })} required placeholder="24BCE1234" className={`${control} font-mono uppercase`} />
            </div>
            <div>
              <label className={label}>Academic year</label>
              <select name="academicYear" value={form.academicYear} onChange={text("academicYear")} className={control}>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Email address</label>
              <input name="email" type="email" value={form.email} onChange={text("email")} required placeholder="name@vitstudent.ac.in" className={control} />
            </div>
            <div>
              <label className={label}>
                Phone <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={text("phone")}
                // "+91 98765 43210" becomes "9876543210" when you leave the field
                onBlur={() => set({ phone: normalizePhone(form.phone) ?? "" })}
                placeholder="9876543210"
                className={control}
              />
            </div>
            <div>
              <label className={label}>Department</label>
              <input
                name="department"
                list="dept-suggestions"
                value={form.department}
                onChange={text("department")}
                // On leaving the field, rewrite any spelling into the standard one.
                onBlur={() => {
                  const n = normalizeDepartment(form.department).label;
                  if (n && n !== form.department) set({ department: n });
                }}
                required
                placeholder="e.g. B.Tech CSE (Core)"
                className={control}
              />
              <datalist id="dept-suggestions">
                {DEPARTMENT_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <p className="mt-1 text-[11px] text-zinc-600">Any spelling works; it is saved in one standard form.</p>
            </div>
          </div>
        </section>

        {/* Club role */}
        <section className={`${panel} p-5 sm:p-6`}>
          <p className={panelTitle}>Club role</p>
          <div className="mt-4 space-y-5">
            <div>
              <label className={label}>Category</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CATEGORIES.map((c) => {
                  const on = form.category === c.v;
                  return (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() =>
                        set({
                          category: c.v,
                          isFFCS: c.v === "FFCS_ONLY" ? true : form.isFFCS,
                          position: "",
                          team: "",
                        })
                      }
                      className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                        on
                          ? "border-violet-400/60 bg-violet-600 text-white"
                          : "border-zinc-700 bg-black/30 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {c.l}
                    </button>
                  );
                })}
              </div>
            </div>

            {isCoreOrMember && (
              <div>
                <label className={label}>
                  Position <span className="text-red-400">(required)</span>
                </label>
                <select value={form.position} onChange={text("position")} required className={control}>
                  <option value="">Select a position...</option>
                  {getTeamsForCategory(form.category).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {isDancer && (
              <>
                <TeamSelector category="DANCER" value={form.team} onChange={(team) => set({ team })} />
                <div>
                  <label className={label}>
                    Dancer role <span className="text-red-400">(required)</span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {DANCER_ROLES.map((role) => (
                      <label
                        key={role}
                        className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                          form.position === role
                            ? "border-violet-400/50 bg-violet-500/15"
                            : "border-zinc-700 bg-black/30 hover:border-zinc-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="position"
                          value={role}
                          checked={form.position === role}
                          onChange={(e) => set({ position: e.target.value })}
                          className="h-4 w-4 shrink-0 accent-violet-500"
                          required
                        />
                        <span className="text-sm text-white">{role}</span>
                        {role === "Team Leader" && (
                          <span className="ml-auto rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] text-violet-300">
                            Admin
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-zinc-700 bg-black/30 px-3 py-3">
              <input
                type="checkbox"
                name="isFFCS"
                checked={isFFCSOnly ? true : form.isFFCS}
                disabled={isFFCSOnly}
                onChange={(e) => set({ isFFCS: e.target.checked })}
                className="h-4 w-4 accent-violet-500"
              />
              <span className="text-sm text-zinc-300">Enrolled in FFCS programme</span>
              {isFFCSOnly && <span className="ml-auto text-xs text-violet-300">Set automatically</span>}
            </label>
          </div>
        </section>

        {/* Account */}
        <section className={`${panel} p-5 sm:p-6`}>
          <p className={panelTitle}>Account</p>
          {mode === "add" ? (
            <div className="mt-4">
              <label className={label}>Temporary password</label>
              <input
                name="password"
                type="password"
                value={form.password ?? ""}
                onChange={text("password")}
                required
                minLength={6}
                placeholder="They will be asked to change it at first login"
                className={control}
              />
              <p className="mt-2 text-xs text-zinc-500">
                The member must choose their own password the first time they sign in.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              Passwords are changed by the member, using the key icon in the sidebar. Admins cannot see or set them here.
            </p>
          )}
        </section>
      </div>

      {/* ── Right: live summary + actions ─────────────────────── */}
      <aside className="mt-6 lg:sticky lg:top-24 lg:mt-0">
        <div className={`${panel} p-5`}>
          <p className={panelTitle}>Summary</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-600/25 text-sm font-bold text-violet-200">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{form.fullName || "New member"}</p>
              <p className="truncate font-mono text-[11px] text-zinc-500">
                {form.registerNumber ? form.registerNumber.toUpperCase() : "Register number"}
              </p>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Category</dt>
              <dd className="text-right text-zinc-200">{categoryLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">{isDancer ? "Role" : "Position"}</dt>
              <dd className="text-right text-zinc-200">{form.position || "Not set"}</dd>
            </div>
            {isDancer && (
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Team</dt>
                <dd className="text-right text-zinc-200">{form.team || "Not set"}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">FFCS</dt>
              <dd className="text-right text-zinc-200">{isFFCSOnly || form.isFFCS ? "Enrolled" : "No"}</dd>
            </div>
          </dl>

          <div
            className={`mt-5 flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-xs ${
              access.admin
                ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
                : "border-zinc-800 bg-black/20 text-zinc-400"
            }`}
          >
            {access.admin ? <ShieldCheck size={15} className="mt-0.5 shrink-0" /> : <User size={15} className="mt-0.5 shrink-0" />}
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest opacity-70">Access</span>
              {access.text}
            </span>
          </div>

          {mode === "add" && (
            <p className="mt-3 flex items-start gap-2 text-[11px] text-zinc-500">
              <KeyRound size={13} className="mt-0.5 shrink-0" />
              Signs in with the email above and the temporary password.
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_rgba(124,58,237,0.9)] transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : mode === "add" ? "Add member" : "Save changes"}
            </button>
            <Link
              href="/members"
              className="rounded-md border border-zinc-700 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </div>
      </aside>
    </form>
  );
}

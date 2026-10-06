import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCog } from "lucide-react";
import { getCaller } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";
import { LogoMark } from "@/components/brand/Logo";
import AccountDetailsForm from "@/components/AccountDetailsForm";

const CATEGORY: Record<string, string> = { CORE: "Core Member", MEMBER: "Normal Member", DANCER: "Dancer", FFCS_ONLY: "FFCS Only" };

// "My details": every logged-in member (dancer, Lead, committee, Normal, FFCS) edits their own
// phone, academic year and programme here. Identity and club fields are shown read-only.
// The "fix your programme" notification and banner link here (/programme redirects here too).
export default async function AccountPage() {
  const caller = await getCaller();
  if (!caller?.member) redirect("/login");
  const m = caller.member;
  const valid = normalizeDepartment(m.department).ok;
  const home = m.category === "DANCER" ? "/dance" : caller.isCommittee ? "/dashboard" : "/profile";

  const fixed = [
    { label: "Name", value: m.fullName },
    { label: "Register number", value: m.registerNumber },
    { label: "Email (login)", value: m.email },
    { label: "Category", value: CATEGORY[m.category] ?? m.category },
    ...(m.position ? [{ label: "Position", value: m.position }] : []),
    ...(m.team ? [{ label: "Dance team", value: m.team }] : []),
    { label: "FFCS", value: m.isFFCS ? "Enrolled" : "No" },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10 text-white">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <LogoMark size={44} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 sm:p-8">
          <div className="flex items-center gap-2 text-amber-300">
            <UserCog size={18} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">My details</p>
          </div>
          <h1 className="mt-2 text-lg font-semibold">{valid ? "Your details" : "Please choose your programme"}</h1>
          <p className="mt-1 mb-6 text-xs text-zinc-400">
            Keep your course, year and phone number up to date. If your programme is not listed, choose Other and type it.
          </p>
          <AccountDetailsForm
            phone={m.phone ?? ""}
            academicYear={m.academicYear}
            department={m.department}
            departmentValid={valid}
            home={home}
          />

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-5 text-xs">
            {fixed.map((x) => (
              <div key={x.label} className="min-w-0">
                <dt className="text-zinc-500">{x.label}</dt>
                <dd className="truncate text-zinc-200">{x.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-zinc-500">
            To change your name, register number, email, role or team, ask {m.category === "DANCER" ? "your Team Leader" : "the committee"}.
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">
          <Link href={home} className="hover:text-zinc-300">Back</Link>
        </p>
      </div>
    </div>
  );
}

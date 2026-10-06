import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { getCaller } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";
import { LogoMark } from "@/components/brand/Logo";
import ProgrammeFixForm from "@/components/ProgrammeFixForm";

// Every member (dancer, committee, Normal, FFCS) can set their own academic programme here.
// The "your programme needs updating" notification links to this page.
export default async function ProgrammePage() {
  const caller = await getCaller();
  if (!caller?.member) redirect("/login");

  const current = caller.member.department ?? "";
  const valid = normalizeDepartment(current).ok;
  // Where "Continue" goes afterwards: each person's own home.
  const home = caller.member.category === "DANCER" ? "/dance" : caller.isCommittee ? "/dashboard" : "/profile";

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4 py-10 text-white">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <LogoMark size={44} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 sm:p-8">
          <div className="flex items-center gap-2 text-amber-300">
            <GraduationCap size={18} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Academic programme</p>
          </div>
          <h1 className="mt-2 text-lg font-semibold">
            {valid ? "Your programme" : "Please choose your programme"}
          </h1>
          <p className="mt-1 mb-6 text-xs text-zinc-400">
            Pick your course from the official VIT Chennai list. If yours is not listed, choose Other and type it.
          </p>
          <ProgrammeFixForm current={current} valid={valid} home={home} />
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">
          <Link href={home} className="hover:text-zinc-300">Back</Link>
        </p>
      </div>
    </div>
  );
}

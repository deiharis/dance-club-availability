import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { needsProgrammeFix } from "@/lib/programme-issues";

// Shown at the top of the Dance Floor, the committee console and the member profile, ONLY to a
// member whose saved course is not a recognised VIT Chennai programme. Gone as soon as it is fixed.
export default function ProgrammeFixBanner({ department }: { department: string | null | undefined }) {
  if (!needsProgrammeFix(department)) return null;
  return (
    <Link
      href="/account"
      className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 transition-colors hover:bg-amber-400/15 sm:mx-8"
    >
      <GraduationCap size={18} className="shrink-0 text-amber-300" />
      <span className="flex-1">
        <span className="font-semibold">Your academic programme needs updating.</span>{" "}
        The course saved on your profile could not be matched to a VIT Chennai programme.
      </span>
      <span className="flex shrink-0 items-center gap-1 font-semibold text-amber-200">
        Fix it <ArrowRight size={14} />
      </span>
    </Link>
  );
}

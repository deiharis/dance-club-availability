import { normalizeDepartment } from "@/lib/departments";

// "Finish setting up" checklist for a member's own account. Shown (on the member profile, the
// committee dashboard and the Dance Floor home) only while a step is still open, and gone once
// everything is done. The password step is always done by the time anyone sees it: middleware
// sends a new account to /change-password first. Pure, so it is easy to check.
export type OnboardingStep = { key: string; label: string; hint: string; done: boolean; href: string };

export function onboardingSteps(
  member: { phone: string | null; department: string; category: string; team: string | null },
  hasTimetable: boolean
): OnboardingStep[] {
  const timetableHref = member.category === "DANCER" ? "/dance/timetable" : "/timetable";
  return [
    { key: "password", label: "Set your own password", hint: "Done when you first logged in", done: true, href: "/change-password" },
    {
      key: "timetable",
      label: "Fill in your timetable",
      hint: member.team ? "Your team and the committee plan rehearsals around it" : "The committee plans meetings around it",
      done: hasTimetable,
      href: timetableHref,
    },
    { key: "programme", label: "Check your programme", hint: "Pick your course from the official list", done: normalizeDepartment(member.department).ok, href: "/account" },
    { key: "phone", label: "Add your phone number", hint: "So your team can reach you", done: !!member.phone?.trim(), href: "/account" },
  ];
}

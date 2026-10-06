import { db } from "@/lib/db";
import { normalizeDepartment } from "@/lib/departments";

// Members whose Department/Course needs a person to fix it: ambiguous ("Computer Science",
// "Law", "B.Sc"), not a programme ("Outreach", "VITBS"), or not offered at VIT Chennai.
// Worked out live from the department text (no extra column), so fixing the course anywhere
// (their own Programme page, or an admin editing them) clears it immediately.
// Safely standardised spellings ("Btech cse" -> "B.Tech CSE (Core)") never count.

export const PROGRAMME_FIX_LINK = "/account"; // My details (/programme also redirects there)
const MESSAGE =
  "Your academic programme information needs to be updated. The course currently saved on your profile could not be matched to a valid VIT Chennai programme. Please open this and select the correct programme.";

export type ProgrammeIssue = {
  id: string;
  fullName: string;
  registerNumber: string;
  category: string;
  department: string;
  issue: "empty" | "not-a-programme" | "ambiguous";
  notified: boolean;
};

export const needsProgrammeFix = (department: string | null | undefined) =>
  !normalizeDepartment(department ?? "").ok;

export async function listProgrammeIssues(): Promise<ProgrammeIssue[]> {
  const members = await db.member.findMany({
    select: {
      id: true,
      fullName: true,
      registerNumber: true,
      category: true,
      department: true,
      notifications: { where: { type: "PROGRAMME_FIX" }, select: { id: true }, take: 1 },
    },
    orderBy: { fullName: "asc" },
  });
  return members.flatMap((m) => {
    const d = normalizeDepartment(m.department);
    if (d.ok) return [];
    return [{
      id: m.id,
      fullName: m.fullName,
      registerNumber: m.registerNumber,
      category: m.category,
      department: m.department,
      issue: d.issue ?? "ambiguous",
      notified: m.notifications.length > 0,
    }];
  });
}

// Notify every member who needs to fix their course and has not been told yet (never twice).
// Never throws: a failed notification must not fail the import or page that called it.
export async function notifyProgrammeIssues(): Promise<number> {
  try {
    const pending = (await listProgrammeIssues()).filter((m) => !m.notified);
    if (pending.length === 0) return 0;
    await db.notification.createMany({
      data: pending.map((m) => ({
        memberId: m.id,
        type: "PROGRAMME_FIX" as const,
        message: MESSAGE,
        link: PROGRAMME_FIX_LINK,
      })),
    });
    return pending.length;
  } catch (error) {
    console.error("notifyProgrammeIssues failed:", error);
    return 0;
  }
}

// Call after a member's department changes. If it is now a valid programme, their
// "fix your programme" notification is removed, so nothing stays active.
export async function resolveProgrammeIssue(memberId: string, department: string) {
  if (needsProgrammeFix(department)) return;
  try {
    await db.notification.deleteMany({ where: { memberId, type: "PROGRAMME_FIX" } });
  } catch (error) {
    console.error("resolveProgrammeIssue failed:", error);
  }
}

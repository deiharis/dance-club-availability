import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

const dateLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC", // dates are stored as UTC midnight
  });
export { dateLabel };

// Notify every dancer in `team` plus every SuperAdmin, except whoever did the action.
// Never throws: the rehearsal/performance/attendance is already saved, so a failed
// notification must not make the request look like it failed.
export async function notifyTeam(opts: {
  team: string;
  actorMemberId?: string | null;
  type: NotificationType;
  message: string;
  link: string;
}) {
  try {
    const [dancers, superAdmins] = await Promise.all([
      db.member.findMany({
        where: { category: "DANCER", team: opts.team },
        select: { id: true },
      }),
      db.member.findMany({
        where: { user: { role: "SUPERADMIN" } },
        select: { id: true },
      }),
    ]);

    const ids = new Set([...dancers, ...superAdmins].map((m) => m.id));
    if (opts.actorMemberId) ids.delete(opts.actorMemberId);
    if (ids.size === 0) return;

    await db.notification.createMany({
      data: Array.from(ids).map((memberId) => ({
        type: opts.type,
        message: opts.message,
        link: opts.link,
        memberId,
      })),
    });
  } catch (error) {
    console.error("notifyTeam failed:", error);
  }
}

export const teamLink = (path: string, team: string) =>
  `${path}?team=${encodeURIComponent(team)}`;

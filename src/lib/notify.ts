import { db } from "@/lib/db";
import type { NotificationType, Prisma } from "@prisma/client";

const dateLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC", // dates are stored as UTC midnight
  });
export { dateLabel };

// ── Two separate feeds ────────────────────────────────────────────────────────
// A notification belongs to the Dance Floor feed if it is one of the team types below,
// or it was sent to a dancer (e.g. a dancer's report decision). Everything else belongs to
// the Working Committee feed. Worked out from existing columns, so no extra database field.
export type NotificationSection = "COMMITTEE" | "DANCE";

const DANCE_TYPES: NotificationType[] = [
  "REHEARSAL_ADDED",
  "PERFORMANCE_ADDED",
  "ATTENDANCE_MARKED",
];

const danceWhere: Prisma.NotificationWhereInput = {
  OR: [{ type: { in: DANCE_TYPES } }, { member: { category: "DANCER" } }],
};

export const sectionWhere = (
  section: NotificationSection | null | undefined
): Prisma.NotificationWhereInput =>
  section === "DANCE" ? danceWhere : section === "COMMITTEE" ? { NOT: danceWhere } : {};

export const parseSection = (v: unknown): NotificationSection | null =>
  v === "DANCE" || v === "COMMITTEE" ? v : null;

// ── Creating notifications ────────────────────────────────────────────────────
// These never throw: the thing being notified about is already saved, so a failed
// notification must not make the request look like it failed.
async function createFor(
  ids: Set<string>,
  data: { type: NotificationType; message: string; link: string }
) {
  if (ids.size === 0) return;
  await db.notification.createMany({
    data: Array.from(ids).map((memberId) => ({ ...data, memberId })),
  });
}

const superAdminMembers = () =>
  db.member.findMany({ where: { user: { role: "SUPERADMIN" } }, select: { id: true } });

// Dance Floor: every dancer in `team` plus every SuperAdmin, except whoever did the action.
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
      superAdminMembers(),
    ]);
    const ids = new Set([...dancers, ...superAdmins].map((m) => m.id));
    if (opts.actorMemberId) ids.delete(opts.actorMemberId);
    await createFor(ids, opts);
  } catch (error) {
    console.error("notifyTeam failed:", error);
  }
}

// Working Committee: every SuperAdmin, except whoever did the action.
export async function notifySuperAdmins(opts: {
  actorMemberId?: string | null;
  type: NotificationType;
  message: string;
  link: string;
}) {
  try {
    const ids = new Set((await superAdminMembers()).map((m) => m.id));
    if (opts.actorMemberId) ids.delete(opts.actorMemberId);
    await createFor(ids, opts);
  } catch (error) {
    console.error("notifySuperAdmins failed:", error);
  }
}

export const teamLink = (path: string, team: string) =>
  `${path}?team=${encodeURIComponent(team)}`;

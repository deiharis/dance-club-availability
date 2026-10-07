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
  "REHEARSAL_CANCELLED",
  "PERFORMANCE_CANCELLED",
];

// Also: the decision on a dance-topic report, even for a Core member who dances.
const danceWhere: Prisma.NotificationWhereInput = {
  OR: [
    { type: { in: DANCE_TYPES } },
    { member: { category: "DANCER" } },
    { report: { area: "DANCE" } },
  ],
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

// Notify specific members (e.g. the dancers just added to a performance).
export async function notifyMembers(opts: {
  memberIds: string[];
  type: NotificationType;
  message: string;
  link: string;
}) {
  try {
    await createFor(new Set(opts.memberIds), opts);
  } catch (error) {
    console.error("notifyMembers failed:", error);
  }
}

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
        where: { team: opts.team },
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

// ── Cancellations ─────────────────────────────────────────────────────────────
// Rehearsal and performance dates are stored as UTC midnight of the (Indian) calendar day.
export const todayIST = () =>
  new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00Z");

// Heading for a notification in the feeds, by Indian calendar day: Today, Yesterday, This week, Earlier.
export function dayGroup(createdAt: Date, now = new Date()) {
  const day = (d: Date) => new Date(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00Z").getTime();
  const days = Math.round((day(now) - day(createdAt)) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? "This week" : "Earlier";
}

// Who cancelled it, in the words the team sees.
export function cancelledBy(caller: { isSuper: boolean; isLead: boolean; member?: { fullName: string } | null }) {
  if (caller.isSuper) return "the Super Admin";
  const name = caller.member?.fullName;
  return caller.isLead ? (name ? `your Team Leader, ${name}` : "your Team Leader") : name ?? "the club";
}

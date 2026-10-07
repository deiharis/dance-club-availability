import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, FileText, FileBadge, ArrowUpRight, Music, UserPlus, GraduationCap, Bell } from "lucide-react";
import { db } from "@/lib/db";
import { getCaller } from "@/lib/dance";
import { sectionWhere, dayGroup } from "@/lib/notify";
import MarkAllRead from "@/components/notifications/MarkAllRead";
import NotificationLink from "@/components/notifications/NotificationLink";
import { EmptyState } from "@/components/ui/states";

// Icon per Working Committee notification type.
const KIND: Record<string, { icon: React.ElementType; color: string }> = {
  REPORT_SUBMITTED: { icon: FileText, color: "text-violet-300 bg-violet-500/15" },
  OD_REQUESTED: { icon: FileBadge, color: "text-violet-300 bg-violet-500/15" },
  MEMBERS_ADDED: { icon: UserPlus, color: "text-sky-300 bg-sky-500/15" },
  REPORT_APPROVED: { icon: CheckCircle, color: "text-emerald-300 bg-emerald-500/15" },
  REPORT_REJECTED: { icon: XCircle, color: "text-red-300 bg-red-500/15" },
  PROGRAMME_FIX: { icon: GraduationCap, color: "text-amber-300 bg-amber-400/15" },
};

export default async function CommitteeNotificationsPage() {
  const caller = await getCaller();
  if (!caller?.member) redirect("/login");
  const memberId = caller.member.id;

  const [notifications, danceUnread] = await Promise.all([
    db.notification.findMany({
      where: { memberId, ...sectionWhere("COMMITTEE") },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Only the SuperAdmin has a Dance Floor feed to point at.
    caller.isSuper
      ? db.notification.count({ where: { memberId, read: false, ...sectionWhere("DANCE") } })
      : Promise.resolve(0),
  ]);
  const unread = notifications.filter((n) => !n.read).length;
  // Newest first, under Today / Yesterday / This week / Earlier.
  const groups: { title: string; items: typeof notifications }[] = [];
  for (const n of notifications) {
    const title = dayGroup(n.createdAt);
    if (groups.at(-1)?.title !== title) groups.push({ title, items: [] });
    groups.at(-1)!.items.push(n);
  }

  return (
    <div>
      <div data-section="Overview" className="c-page-header flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white">Notifications</h1>
          <p className="text-zinc-500 mt-0.5">
            Working Committee. {unread > 0 ? `${unread} unread.` : "You are all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {caller.isSuper && (
            <Link
              href="/dance/notifications"
              className="flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <Music size={14} />
              <span className="hidden sm:inline">Dance Floor updates</span>
              {danceUnread > 0 && (
                <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-orange-300">
                  {danceUnread}
                </span>
              )}
            </Link>
          )}
          {unread > 0 && <MarkAllRead section="COMMITTEE" tone="console" />}
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-3xl">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" body="New reports and OD requests that need a decision, and news about your own reports, will show up here." />
        ) : (
          groups.map((g) => (
            <section key={g.title} className="mb-6">
              <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{g.title}</h2>
              <div className="divide-y divide-zinc-800/70 overflow-hidden rounded-lg border border-zinc-800 bg-surface">
                {g.items.map((n) => {
                  const kind = KIND[n.type] ?? KIND.REPORT_SUBMITTED;
                  const Icon = kind.icon;
                  const row = (
                    <div
                      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] ${
                        n.read ? "" : "bg-violet-500/[0.06]"
                      }`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${kind.color}`}>
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${n.read ? "text-zinc-300" : "font-medium text-white"}`}>
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {n.createdAt.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                          })}
                        </p>
                      </div>
                      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />}
                      {n.link && <ArrowUpRight size={14} className="mt-1.5 shrink-0 text-zinc-600" />}
                    </div>
                  );
                  return n.link ? (
                    <NotificationLink key={n.id} id={n.id} href={n.link} unread={!n.read}>
                      {row}
                    </NotificationLink>
                  ) : (
                    <div key={n.id}>{row}</div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

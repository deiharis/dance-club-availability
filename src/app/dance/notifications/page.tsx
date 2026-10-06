import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, CalendarDays, Star, ClipboardCheck, ArrowUpRight, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import { sectionWhere } from "@/lib/notify";
import StageHeader from "@/components/dance/StageHeader";
import MarkAllRead from "@/components/notifications/MarkAllRead";

// Icon and colour per notification type.
const KIND: Record<string, { icon: React.ElementType; color: string }> = {
  REPORT_APPROVED: { icon: CheckCircle, color: "text-green-400" },
  PROGRAMME_FIX: { icon: GraduationCap, color: "text-amber-300" },
  REPORT_REJECTED: { icon: XCircle, color: "text-red-400" },
  REHEARSAL_ADDED: { icon: CalendarDays, color: "text-amber-300" },
  PERFORMANCE_ADDED: { icon: Star, color: "text-amber-300" },
  ATTENDANCE_MARKED: { icon: ClipboardCheck, color: "text-amber-300" },
};

export default async function DanceNotificationsPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  const memberId = dance.member.id;

  const [notifications, committeeUnread] = await Promise.all([
    db.notification.findMany({
      where: { memberId, ...sectionWhere("DANCE") },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    // Only committee members have a Working Committee feed to point at.
    dance.isCommittee
      ? db.notification.count({ where: { memberId, read: false, ...sectionWhere("COMMITTEE") } })
      : Promise.resolve(0),
  ]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <StageHeader
        eyebrow="Dance Floor"
        title="Your"
        accent="updates"
        subtitle={`Rehearsals, performances, attendance and report decisions. ${unread > 0 ? `${unread} unread.` : "You are all caught up."}`}
      >
        <div className="flex flex-col items-end gap-2">
          {unread > 0 && <MarkAllRead section="DANCE" tone="stage" />}
          {dance.isCommittee && (
            <Link
              href="/notifications"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-orange-100/70 transition hover:border-violet-400/50 hover:text-white"
            >
              Committee notifications
              {committeeUnread > 0 && (
                <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-200">
                  {committeeUnread}
                </span>
              )}
              <ArrowUpRight size={12} />
            </Link>
          )}
        </div>
      </StageHeader>

      <div className="space-y-3">
        {notifications.length === 0 && (
          <p className="text-orange-100/50 text-sm">No notifications yet.</p>
        )}
        {notifications.map((n) => {
          const kind = KIND[n.type] ?? KIND.REHEARSAL_ADDED;
          const Icon = kind.icon;
          const card = (
            <div
              className={`flex items-start gap-3 rounded-3xl border px-4 py-3 transition ${
                n.read
                  ? "bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border-white/10"
                  : "bg-orange-500/10 border-orange-500/30"
              } ${n.link ? "hover:border-amber-300/40" : ""}`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${kind.color}`} />
              <div>
                <p className="text-white text-sm">{n.message}</p>
                <p className="text-orange-100/50 text-xs mt-1">
                  {n.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  })}
                </p>
              </div>
            </div>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} className="block">
              {card}
            </Link>
          ) : (
            <div key={n.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

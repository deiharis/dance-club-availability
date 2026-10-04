import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, CalendarDays, Star, ClipboardCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import MarkReadButton from "@/components/dance/MarkReadButton";

// Icon and colour per notification type.
const KIND: Record<string, { icon: React.ElementType; color: string }> = {
  REPORT_APPROVED: { icon: CheckCircle, color: "text-green-400" },
  REPORT_REJECTED: { icon: XCircle, color: "text-red-400" },
  REHEARSAL_ADDED: { icon: CalendarDays, color: "text-amber-300" },
  PERFORMANCE_ADDED: { icon: Star, color: "text-amber-300" },
  ATTENDANCE_MARKED: { icon: ClipboardCheck, color: "text-amber-300" },
};

export default async function DanceNotificationsPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { memberId: dance.member.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <StageHeader
        eyebrow="Notifications"
        title="Your"
        accent="updates"
        subtitle={`Report decisions and team updates. ${unread > 0 ? `${unread} unread.` : "You are all caught up."}`}
      >
        {unread > 0 && <MarkReadButton />}
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

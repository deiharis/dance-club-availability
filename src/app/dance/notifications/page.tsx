import { redirect } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import MarkReadButton from "@/components/dance/MarkReadButton";

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">Notifications</h1>
          <p className="text-orange-100/60 text-sm mt-1">
            Updates on your reports. {unread > 0 ? `${unread} unread.` : "You are all caught up."}
          </p>
        </div>
        {unread > 0 && <MarkReadButton />}
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 && (
          <p className="text-orange-100/50 text-sm">No notifications yet.</p>
        )}
        {notifications.map((n) => {
          const approved = n.type === "REPORT_APPROVED";
          const Icon = approved ? CheckCircle : XCircle;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-3xl border px-4 py-3 ${
                n.read
                  ? "bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] border-white/10"
                  : "bg-orange-500/10 border-orange-500/30"
              }`}
            >
              <Icon
                size={18}
                className={`mt-0.5 shrink-0 ${approved ? "text-green-400" : "text-red-400"}`}
              />
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
        })}
      </div>
    </div>
  );
}

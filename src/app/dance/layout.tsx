import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDanceUser } from "@/lib/dance";
import { db } from "@/lib/db";
import DanceSidebar from "@/components/dance/DanceSidebar";

export default async function DanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  const label = dance.isSuper
    ? "Super Admin"
    : dance.isLead
    ? "Dance Lead"
    : dance.member.category === "DANCER"
    ? "Dancer"
    : "Committee";

  // Sidebar badges: unread notifications, and (for Leads) reports waiting on them.
  const [unread, pending] = await Promise.all([
    db.notification.count({ where: { memberId: dance.member.id, read: false } }),
    dance.isLead && dance.member.team
      ? db.report.count({
          where: {
            status: "PENDING",
            member: {
              category: "DANCER",
              team: dance.member.team,
              id: { not: dance.member.id },
            },
          },
        })
      : Promise.resolve(0),
  ]);

  return (
    <div className="min-h-screen bg-[#0b0614] text-white flex">
      <DanceSidebar
        userName={session.user.name ?? "Dancer"}
        userEmail={session.user.email ?? ""}
        label={label}
        canManage={dance.isLead || dance.isCommittee}
        isCommittee={dance.isCommittee}
        badges={{ "/dance/notifications": unread, "/dance/reports": pending }}
      />
      {/* pt-14 on mobile accounts for the fixed top bar */}
      <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}

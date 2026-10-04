import { Sora } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDanceUser, leadReviewedWhere } from "@/lib/dance";
import { db } from "@/lib/db";
import { sectionWhere } from "@/lib/notify";
import DanceSidebar from "@/components/dance/DanceSidebar";
import WaveBackdrop from "@/components/dance/WaveBackdrop";

// Dance Floor has its own display typeface; the committee keeps Inter.
const stage = Sora({ subsets: ["latin"], weight: ["300", "400", "600"] });

export default async function DanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  // Dance Floor is for anyone in a dance team, plus the committee (who manage every team).
  // Checked against the database, so a member added to a team gets in without re-logging.
  if (!dance.isCommittee && !dance.member.team) redirect("/profile");

  const label = dance.isSuper
    ? "Super Admin"
    : dance.isLead
    ? "Dance Lead"
    : dance.isCommittee
    ? "Committee"
    : "Dancer";

  // Sidebar badges: unread notifications, and (for Leads) reports waiting on them.
  const [unread, pending] = await Promise.all([
    // Dance Floor feed only; committee notifications have their own badge in the console.
    db.notification.count({
      where: { memberId: dance.member.id, read: false, ...sectionWhere("DANCE") },
    }),
    dance.isLead && dance.member.team
      ? db.report.count({
          where: {
            status: "PENDING",
            ...leadReviewedWhere,
            member: { team: dance.member.team, id: { not: dance.member.id } },
          },
        })
      : Promise.resolve(0),
  ]);

  return (
    <div
      className={`${stage.className} stage-glow relative min-h-[100dvh] bg-base text-white`}
    >
      {/* Animated wave across the top of every Dance Floor page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <WaveBackdrop />
      </div>
      <DanceSidebar
        userName={session.user.name ?? "Dancer"}
        userEmail={session.user.email ?? ""}
        label={label}
        canManage={dance.isLead || dance.isCommittee}
        isCommittee={dance.isCommittee}
        badges={{ "/dance/notifications": unread, "/dance/reports": pending }}
      />
      {/* Offset for the floating sidebar (desktop) and the floating top bar (mobile) */}
      <main className="relative min-w-0 pt-20 lg:pt-4 lg:pl-[18rem]">{children}</main>
    </div>
  );
}

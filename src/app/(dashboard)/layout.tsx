import { consoleFont } from "@/lib/fonts";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { getCaller } from "@/lib/dance";
import ProgrammeFixBanner from "@/components/ProgrammeFixBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const caller = await getCaller();
  if (!caller) redirect("/login");

  // Working Committee console: SuperAdmin and Core only. Checked against the DATABASE (the
  // middleware reads the login token, which is stale until the next login), so a Core member
  // changed to Dance Lead or Normal member loses access immediately.
  if (!caller.isCommittee) redirect(caller.member?.category === "DANCER" ? "/dance" : "/profile");

  return (
    <div className={`${consoleFont.className} committee-ui min-h-screen bg-base text-white flex`}>
      <Sidebar
        userName={caller.member?.fullName ?? "Admin"}
        userEmail={caller.member?.email ?? ""}
        role={caller.role}
        showDanceFloor={caller.seesAllTeams || caller.inTeam}
      />
      {/* pt-14 on mobile accounts for the fixed top bar */}
      <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        <ProgrammeFixBanner department={caller.member?.department} />
        {children}
      </main>
    </div>
  );
}

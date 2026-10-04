import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCaller } from "@/lib/dance";
import { consoleFont } from "@/lib/fonts";
import Sidebar from "@/components/layout/Sidebar";
import MemberShell, { MemberHeading } from "@/components/member/MemberShell";
import MyReports from "@/components/reports/MyReports";

// Everyone submits reports here, but each kind of user gets their own frame:
// dancers -> Dance Floor, Core/committee -> the console sidebar, Normal Members -> member portal.
export default async function SubmitReportPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const caller = await getCaller();
  if (caller?.member?.category === "DANCER") redirect("/dance/my-reports");

  const name = session.user.name ?? "Member";

  // Committee (SuperAdmin and Core): inside the console, like the Timetable page does.
  if (caller?.isCommittee) {
    return (
      <div className={`${consoleFont.className} committee-ui min-h-screen bg-base text-white flex`}>
        <Sidebar
          userName={name}
          userEmail={session.user.email ?? ""}
          role={session.user.role}
        />
        <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
          <div data-section="Work" className="c-page-header">
            <h1 className="text-white">My reports</h1>
            <p className="text-zinc-500 mt-0.5">Submit work reports and request OD</p>
          </div>
          <div className="p-4 sm:p-8 max-w-3xl">
            <MyReports variant="member" showOd />
          </div>
        </main>
      </div>
    );
  }

  // Normal and FFCS-only members: the member portal.
  return (
    <MemberShell name={name}>
      <MemberHeading label="Work" title="My reports" subtitle="Submit work reports and request OD for approved ones." />
      <div className="max-w-3xl">
        <MyReports variant="member" showOd />
      </div>
    </MemberShell>
  );
}

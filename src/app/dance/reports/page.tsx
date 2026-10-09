import { redirect } from "next/navigation";
import { getDanceUser } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import ReviewReports from "@/components/reports/ReviewReports";
import NoAccess from "@/components/dance/NoAccess";

export default async function DanceReportsPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.isSuper) {
    return (
      <NoAccess
        title="Reviewing reports is for Team Leaders"
        body="Your team's Team Leader reviews dancers' reports. To send your own report, use My Reports in the menu."
        back={{ label: "Go to My Reports", href: "/dance/my-reports" }}
      />
    );
  }

  // The API already limits a Lead to their own team's dancers' reports.
  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <StageHeader
        eyebrow={dance.member.team ?? "Dance Floor"}
        title="Review"
        accent="reports"
        subtitle="Approve or reject the work your team members submit."
      />
      <ReviewReports variant="stage" />
    </div>
  );
}

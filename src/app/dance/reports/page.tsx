import { redirect } from "next/navigation";
import { getDanceUser } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import ReviewReports from "@/components/reports/ReviewReports";

export default async function DanceReportsPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.isCommittee) redirect("/dance");

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

import { redirect } from "next/navigation";
import { getDanceUser } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import MyReports from "@/components/reports/MyReports";

// Dancers submit reports here (reports only, no OD). Their Team Leader reviews them.
export default async function DanceMyReportsPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <StageHeader
        eyebrow={dance.member.team ?? "Dance Floor"}
        title="My"
        accent="reports"
        subtitle="Log your contributions so your Team Leader can verify them."
      />
      <MyReports variant="stage" showOd={false} area={dance.member.category === "DANCER" ? "DANCE" : "ask"} />
    </div>
  );
}

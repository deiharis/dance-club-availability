import { redirect } from "next/navigation";
import { getDanceUser } from "@/lib/dance";
// Reuses the existing review screen. The API already limits a Lead to their own team's reports.
import ReviewReportsPage from "@/app/(dashboard)/reports/review/page";

export default async function DanceReportsPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.isCommittee) redirect("/dance");

  return <ReviewReportsPage />;
}

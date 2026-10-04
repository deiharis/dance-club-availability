import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ReviewReports from "@/components/reports/ReviewReports";

export default async function ReviewReportsPage() {
  const session = await getServerSession(authOptions);
  // Dancers' reports belong to their dance teams: only the SuperAdmin sees every team's.
  const isSuper = session?.user.role === "SUPERADMIN";

  return (
    <div>
      <div data-section="Work" className="c-page-header">
        <h1 className="text-white">Review reports</h1>
        <p className="text-zinc-500 mt-0.5">Approve or reject member work reports</p>
      </div>
      <div className="p-4 sm:p-8 max-w-4xl">
        <ReviewReports variant="console" canViewDancers={isSuper} />
      </div>
    </div>
  );
}

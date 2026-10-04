import ReviewReports from "@/components/reports/ReviewReports";

export default function ReviewReportsPage() {
  return (
    <div>
      <div data-section="Work" className="c-page-header">
        <h1 className="text-white">Review reports</h1>
        <p className="text-zinc-500 mt-0.5">Approve or reject member work reports</p>
      </div>
      <div className="p-4 sm:p-8 max-w-4xl">
        <ReviewReports variant="console" canViewDancers />
      </div>
    </div>
  );
}

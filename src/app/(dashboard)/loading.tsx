import { Skeleton } from "@/components/ui/states";

// Shown instantly while a Working Committee page loads (the sidebar stays in place), so a click
// always gets immediate feedback and the layout does not jump when the data arrives.
export default function ConsoleLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="border-b border-zinc-800 px-4 py-4 sm:px-8">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-6 w-56" />
      </div>
      <div className="space-y-6 p-4 sm:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

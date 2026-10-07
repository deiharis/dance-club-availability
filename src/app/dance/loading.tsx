import { Skeleton } from "@/components/ui/states";

// Shown instantly while a Dance Floor page loads (sidebar stays), in the stage style.
export default function StageLoading() {
  return (
    <div className="max-w-5xl p-4 sm:p-8" aria-busy="true" aria-label="Loading">
      <Skeleton stage className="h-6 w-28 rounded-full" />
      <Skeleton stage className="mt-4 h-12 w-80 max-w-full" />
      <Skeleton stage className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton stage key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Skeleton stage className="mt-6 h-64 rounded-3xl" />
    </div>
  );
}

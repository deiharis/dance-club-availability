import { Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/states";

// Shown instead of silently redirecting when someone opens a Dance Floor page they may not use
// (a shared link, an old bookmark, the address bar). Same permissions as before; it just says why.
export default function NoAccess({
  title,
  body,
  back = { label: "Back to Dance Floor", href: "/dance" },
}: {
  title: string;
  body: string;
  back?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto max-w-xl p-4 pt-10 sm:p-8 sm:pt-16">
      <EmptyState stage icon={Lock} title={title} body={body} action={back} />
    </div>
  );
}

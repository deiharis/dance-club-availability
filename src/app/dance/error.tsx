"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

// Dance Floor pages: friendly error inside the stage (sidebar stays).
export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} variant="stage" />;
}

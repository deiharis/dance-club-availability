"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

// Any other page (login, member portal, timetable, reports): friendly full-page error.
export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} variant="plain" />;
}

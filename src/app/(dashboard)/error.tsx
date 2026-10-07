"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

// Working Committee pages: friendly error inside the console (sidebar stays).
export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} variant="console" />;
}

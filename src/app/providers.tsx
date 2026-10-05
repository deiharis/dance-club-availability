"use client";

import { SessionProvider } from "next-auth/react";
import IdleLogout from "@/components/IdleLogout";
import AmbientBackground from "@/components/ambient/AmbientBackground";
import AmbientAudio from "@/components/ambient/AmbientAudio";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdleLogout />
      {children}
      {/* Mounted once for the whole site, so sound and effects carry across page changes */}
      <AmbientBackground />
      <AmbientAudio />
    </SessionProvider>
  );
}

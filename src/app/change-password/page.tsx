import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { brandFont } from "@/lib/fonts";
import { LogoLockup } from "@/components/brand/Logo";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Read the flag from the database (not the login token) so it is always current.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  return (
    // Same stage look as the login page: it sits between signing in and the app.
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_60%)]" />
      <div className="page-enter relative w-full max-w-md">
        <div className={`mb-8 flex justify-center ${brandFont.className}`}>
          <LogoLockup size={56} stacked />
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-8">
          <ChangePasswordForm forced={!!user?.mustChangePassword} />
        </div>
      </div>
    </div>
  );
}

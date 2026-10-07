import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { consoleFont } from "@/lib/fonts";
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
    <div className={`${consoleFont.className} flex min-h-screen items-center justify-center bg-base p-4`}>
      <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-surface p-6 sm:p-8">
        <ChangePasswordForm forced={!!user?.mustChangePassword} />
      </div>
    </div>
  );
}

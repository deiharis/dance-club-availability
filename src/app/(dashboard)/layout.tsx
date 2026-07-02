import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  if (role === "MEMBER") redirect("/profile");

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      <Sidebar
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
        role={role}
      />
      {/* pt-14 on mobile accounts for the fixed top bar */}
      <main className="flex-1 lg:ml-60 min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
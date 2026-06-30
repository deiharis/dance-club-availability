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

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/profile");
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex">
      <Sidebar
        userName={session.user.name ?? "Admin"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 ml-60 min-w-0">
        {children}
      </main>
    </div>
  );
}
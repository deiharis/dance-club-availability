import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import AttendanceMarker from "@/components/dance/AttendanceMarker";

export default async function MarkAttendancePage({
  params,
}: {
  params: { id: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  const rehearsal = await db.rehearsal.findUnique({
    where: { id: params.id },
    include: { attendance: true },
  });
  if (!rehearsal) notFound();
  if (!dance.canManage(rehearsal.team)) redirect("/dance/attendance");

  const dancers = await db.member.findMany({
    where: { category: "DANCER", team: rehearsal.team },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });
  const byMember = new Map(rehearsal.attendance.map((a) => [a.memberId, a.status]));

  const when = rehearsal.date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <Link
        href={`/dance/attendance?team=${encodeURIComponent(rehearsal.team)}`}
        className="inline-flex items-center gap-2 text-sm text-purple-300/60 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to attendance
      </Link>
      <h1 className="text-xl font-bold text-white mt-3">{rehearsal.title}</h1>
      <p className="text-purple-200/60 text-sm mt-1">
        {rehearsal.team} · {when} · {rehearsal.startTime} - {rehearsal.endTime}
      </p>

      <div className="mt-6">
        <AttendanceMarker
          rehearsalId={rehearsal.id}
          dancers={dancers.map((d) => ({
            id: d.id,
            fullName: d.fullName,
            status: byMember.get(d.id) ?? null,
          }))}
        />
      </div>
    </div>
  );
}

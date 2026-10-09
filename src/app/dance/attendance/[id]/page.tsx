import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/ui/states";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import AttendanceMarker from "@/components/dance/AttendanceMarker";
import NoAccess from "@/components/dance/NoAccess";

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
  if (!dance.canManage(rehearsal.team)) {
    return (
      <NoAccess
        title="Only this team's Team Leader marks attendance"
        body="You can see your own attendance record on the Attendance page."
        back={{ label: "Go to Attendance", href: "/dance/attendance" }}
      />
    );
  }

  const dancers = await db.member.findMany({
    where: { team: rehearsal.team },
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
        className="inline-flex items-center gap-2 text-sm text-orange-100/60 hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to attendance
      </Link>
      <div className="mt-4">
        <StageHeader
          eyebrow={rehearsal.team}
          title={rehearsal.title}
          subtitle={`${when} · ${rehearsal.startTime} - ${rehearsal.endTime}`}
        />
      </div>

      <div className="mt-6">
        {rehearsal.cancelledAt ? (
          <EmptyState
            stage
            icon={CalendarX2}
            title="This rehearsal was cancelled"
            body={`Cancelled by ${rehearsal.cancelledBy ?? "the club"}, so there is no attendance to mark.`}
            action={{ label: "Back to rehearsals", href: `/dance/rehearsals?team=${encodeURIComponent(rehearsal.team)}` }}
          />
        ) : (
          <AttendanceMarker
            rehearsalId={rehearsal.id}
            dancers={dancers.map((d) => ({
              id: d.id,
              fullName: d.fullName,
              status: byMember.get(d.id) ?? null,
            }))}
          />
        )}
      </div>
    </div>
  );
}

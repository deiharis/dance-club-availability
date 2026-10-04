import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "text-green-300 bg-green-500/15",
  ABSENT: "text-red-300 bg-red-500/15",
  EXCUSED: "text-amber-300 bg-amber-500/15",
};
const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  EXCUSED: "Excused",
};

const fmt = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

// Attendance % = Present / (Present + Absent). Excused and unmarked are left out.
const pct = (present: number, absent: number) =>
  present + absent === 0 ? "-" : `${Math.round((present / (present + absent)) * 100)}%`;

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  const team = dance.isCommittee
    ? DANCER_TEAMS.includes(searchParams.team ?? "")
      ? (searchParams.team as string)
      : DANCER_TEAMS[0]
    : dance.member.team;

  if (!team) {
    return (
      <div className="p-8 text-purple-200/70 text-sm">
        You are not assigned to a dance team yet. Ask the committee to set your team.
      </div>
    );
  }

  // Rehearsals up to and including today
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const rehearsals = await db.rehearsal.findMany({
    where: { team, date: { lte: today } },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    include: { attendance: true },
  });

  const manager = dance.canManage(team);

  const dancers = manager
    ? await db.member.findMany({
        where: { category: "DANCER", team },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
      })
    : [];

  const count = (memberId: string, status: string) =>
    rehearsals.filter((r) =>
      r.attendance.some((a) => a.memberId === memberId && a.status === status)
    ).length;

  const myId = dance.member.id;
  const myPresent = count(myId, "PRESENT");
  const myAbsent = count(myId, "ABSENT");

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white">Attendance</h1>
      <p className="text-purple-200/60 text-sm mt-1">
        {team} rehearsal attendance. Percentage = present out of present plus absent; excused is not counted.
      </p>

      {dance.isCommittee && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/attendance?team=${encodeURIComponent(t)}`}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                t === team
                  ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-200"
                  : "border-fuchsia-950 text-purple-200/60 hover:text-white"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Lead / committee: per-dancer percentages */}
      {manager && dancers.length > 0 && (
        <div className="mt-6 bg-[#140a1f] border border-fuchsia-950 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-purple-300/50 text-xs border-b border-fuchsia-950">
                <th className="px-4 py-3 font-medium">Dancer</th>
                <th className="px-4 py-3 font-medium">Present</th>
                <th className="px-4 py-3 font-medium">Absent</th>
                <th className="px-4 py-3 font-medium">Excused</th>
                <th className="px-4 py-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {dancers.map((d) => {
                const p = count(d.id, "PRESENT");
                const a = count(d.id, "ABSENT");
                return (
                  <tr key={d.id} className="border-b border-fuchsia-950/60 last:border-0">
                    <td className="px-4 py-3 text-white">{d.fullName}</td>
                    <td className="px-4 py-3 text-purple-100/80">{p}</td>
                    <td className="px-4 py-3 text-purple-100/80">{a}</td>
                    <td className="px-4 py-3 text-purple-100/80">{count(d.id, "EXCUSED")}</td>
                    <td className="px-4 py-3 text-fuchsia-200 font-medium">{pct(p, a)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dancers: own percentage */}
      {!manager && (
        <div className="mt-6 inline-block bg-[#140a1f] border border-fuchsia-950 rounded-xl px-5 py-4">
          <p className="text-purple-300/50 text-xs">Your attendance</p>
          <p className="text-white text-2xl font-semibold mt-1">
            {pct(myPresent, myAbsent)}
          </p>
        </div>
      )}

      <h2 className="text-sm font-medium text-purple-200/70 mt-8 mb-3">
        {manager ? "Rehearsals (tap one to mark attendance)" : "Your record"}
      </h2>

      {rehearsals.length === 0 ? (
        <p className="text-purple-300/50 text-sm">
          No rehearsals have happened yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rehearsals.map((r) => {
            const mine = r.attendance.find((a) => a.memberId === myId)?.status;
            const body = (
              <div className="bg-[#140a1f] border border-fuchsia-950 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-medium">{r.title}</p>
                  <p className="text-purple-300/60 text-xs mt-0.5">
                    {fmt(r.date)} · {r.startTime} - {r.endTime}
                  </p>
                </div>
                {manager ? (
                  <span className="text-xs text-purple-300/60">
                    {r.attendance.length}/{dancers.length} marked
                  </span>
                ) : (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      mine ? STATUS_STYLE[mine] : "text-purple-300/50"
                    }`}
                  >
                    {mine ? STATUS_LABEL[mine] : "Not marked"}
                  </span>
                )}
              </div>
            );
            return manager ? (
              <Link key={r.id} href={`/dance/attendance/${r.id}`} className="block hover:opacity-90">
                {body}
              </Link>
            ) : (
              <div key={r.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

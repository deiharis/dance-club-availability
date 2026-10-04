import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import TimetableGrid from "@/components/timetable/TimetableGrid";

const toEntries = (rows: { day: any; slot: string; status: string }[]) =>
  rows.map((e) => ({
    day: e.day,
    slot: e.slot,
    status: e.status as "FREE" | "CLASS",
  }));

export default async function DanceTimetablePage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  const { member, isLead, isSuper } = dance;

  const myEntries = await db.timetableEntry.findMany({
    where: { memberId: member.id },
  });

  // Leads see their team's timetables (read-only) to plan rehearsals.
  // ponytail: one query per teammate; fine for team-sized lists.
  const teammates =
    (isLead || isSuper) && member.team
      ? await db.member.findMany({
          where: {
            category: "DANCER",
            team: member.team,
            id: { not: member.id },
          },
          orderBy: { fullName: "asc" },
          include: { timetableEntries: true },
        })
      : [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-white">My Timetable</h1>
      <p className="text-purple-200/60 text-sm mt-1">
        Click any cell to toggle between Free and Class.
      </p>

      <div className="mt-6 bg-[#140a1f] border border-fuchsia-950 rounded-xl p-4 sm:p-6">
        <TimetableGrid
          memberId={member.id}
          initialEntries={toEntries(myEntries)}
          readonly={false}
        />
      </div>

      {teammates.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">
            {member.team} timetables
          </h2>
          <p className="text-purple-200/60 text-sm mt-1">
            View only. Use these to find a time when everyone is free.
          </p>
          <div className="mt-4 space-y-6">
            {teammates.map((t) => (
              <div
                key={t.id}
                className="bg-[#140a1f] border border-fuchsia-950 rounded-xl p-4 sm:p-6"
              >
                <p className="text-white text-sm font-medium mb-3">
                  {t.fullName}
                  {t.position ? ` · ${t.position}` : ""}
                </p>
                <TimetableGrid
                  memberId={t.id}
                  initialEntries={toEntries(t.timetableEntries)}
                  readonly={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

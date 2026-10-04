import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";
import RehearsalsClient from "@/components/dance/RehearsalsClient";

export default async function RehearsalsPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  // Committee picks any team; dancers and Leads see their own.
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

  const rows = await db.rehearsal.findMany({
    where: { team },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const today = new Date().toISOString().slice(0, 10);
  const all = rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date.toISOString().slice(0, 10),
    startTime: r.startTime,
    endTime: r.endTime,
    venue: r.venue,
  }));
  const upcoming = all.filter((r) => r.date >= today);
  const past = all.filter((r) => r.date < today).reverse();

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white">Rehearsals</h1>
      <p className="text-purple-200/60 text-sm mt-1">
        {team} practice schedule.
      </p>

      {dance.isCommittee && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/rehearsals?team=${encodeURIComponent(t)}`}
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

      <div className="mt-6">
        <RehearsalsClient
          team={team}
          upcoming={upcoming}
          past={past}
          canManage={dance.canManage(team)}
        />
      </div>
    </div>
  );
}

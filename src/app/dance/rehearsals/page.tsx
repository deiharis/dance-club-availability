import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser, pageTeam } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
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
  // Committee: the chosen tab, else their own team if they dance. Others: their own team.
  const team = pageTeam(dance, searchParams.team);

  if (!team) {
    return (
      <div className="p-8 text-orange-100/70 text-sm">
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
      <StageHeader
        eyebrow={team}
        title="Rehearsal"
        accent="schedule"
        subtitle="When and where the team practises."
      />

      {dance.seesAllTeams && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/rehearsals?team=${encodeURIComponent(t)}`}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                t === team
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-200"
                  : "border-white/10 text-orange-100/60 hover:text-white"
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

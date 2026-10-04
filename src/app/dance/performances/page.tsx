import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";
import PerformancesClient from "@/components/dance/PerformancesClient";

export default async function PerformancesPage({
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

  const [dancers, rows] = await Promise.all([
    db.member.findMany({
      where: { category: "DANCER", team },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, skillLevel: true },
    }),
    db.performance.findMany({
      where: { team },
      orderBy: { eventDate: "asc" },
      include: { dancers: { select: { id: true } } },
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const all = rows.map((p) => ({
    id: p.id,
    name: p.name,
    date: p.eventDate.toISOString().slice(0, 10),
    venue: p.venue,
    dancerIds: p.dancers.map((d) => d.id),
  }));
  const upcoming = all.filter((p) => p.date >= today);
  const past = all.filter((p) => p.date < today).reverse();

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white">Performances</h1>
      <p className="text-purple-200/60 text-sm mt-1">
        {team} performances and who is dancing in them.
      </p>

      {dance.isCommittee && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/performances?team=${encodeURIComponent(t)}`}
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
        <PerformancesClient
          team={team}
          dancers={dancers}
          upcoming={upcoming}
          past={past}
          canManage={dance.canManage(team)}
          myId={dance.member.id}
        />
      </div>
    </div>
  );
}

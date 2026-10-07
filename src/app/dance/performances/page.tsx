import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser, pageTeam } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import { DANCER_TEAMS } from "@/lib/teams";
import PerformancesClient from "@/components/dance/PerformancesClient";
import { todayIST } from "@/lib/notify";

const ist = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default async function PerformancesPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");

  // Committee: the chosen tab, else their own team if they dance. Others: their own team.
  const team = pageTeam(dance, searchParams.team);

  if (!team) {
    return (
      <div className="p-8 text-orange-100/70 text-sm">
        You are not assigned to a dance team yet. Ask the committee to set your team.
      </div>
    );
  }

  const [dancers, rows] = await Promise.all([
    db.member.findMany({
      where: { team },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, skillLevel: true },
    }),
    db.performance.findMany({
      where: { team },
      orderBy: { eventDate: "asc" },
      include: { dancers: { select: { id: true } } },
    }),
  ]);

  // Indian calendar day, so between midnight and 05:30 yesterday is not still "upcoming".
  const today = todayIST().toISOString().slice(0, 10);
  const all = rows.map((p) => ({
    id: p.id,
    name: p.name,
    date: p.eventDate.toISOString().slice(0, 10),
    venue: p.venue,
    dancerIds: p.dancers.map((d) => d.id),
    cancelledAt: p.cancelledAt ? ist(p.cancelledAt) : null,
    cancelledBy: p.cancelledBy,
  }));
  const upcoming = all.filter((p) => p.date >= today);
  const past = all.filter((p) => p.date < today).reverse();

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <StageHeader
        eyebrow={team}
        title="On"
        accent="stage"
        subtitle="Performances and who is dancing in them."
      />

      {dance.seesAllTeams && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/performances?team=${encodeURIComponent(t)}`}
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
        <PerformancesClient
          team={team}
          dancers={dancers}
          upcoming={upcoming}
          past={past}
          today={today}
          canManage={dance.canManage(team)}
          myId={dance.member.id}
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser, pageTeam } from "@/lib/dance";
import StageHeader from "@/components/dance/StageHeader";
import { DANCER_TEAMS } from "@/lib/teams";
import RosterClient from "@/components/dance/RosterClient";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.isSuper) redirect("/dance");

  // Committee picks any team; a Lead is fixed to their own.
  // Committee: the chosen tab, else their own team if they dance. Others: their own team.
  const team = pageTeam(dance, searchParams.team);

  if (!team) {
    return (
      <div className="p-8 text-orange-100/70 text-sm">
        You are not assigned to a dance team yet. Ask the committee to set your team.
      </div>
    );
  }

  const dancers = await db.member.findMany({
    where: { team },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      registerNumber: true,
      email: true,
      position: true,
      category: true,
      skillLevel: true,
      isFFCS: true,
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <StageHeader
        eyebrow={team}
        title="Team"
        accent="roster"
        subtitle="Add dancers, set their skill level, and remove them from the team."
      />

      {dance.isSuper && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/roster?team=${encodeURIComponent(t)}`}
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
        <RosterClient
          team={team}
          dancers={dancers}
          selfId={dance.member.id}
          canTransfer={dance.isSuper}
        />
      </div>
    </div>
  );
}

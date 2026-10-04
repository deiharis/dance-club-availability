import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";
import RosterClient from "@/components/dance/RosterClient";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.isCommittee) redirect("/dance");

  // Committee picks any team; a Lead is fixed to their own.
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

  const dancers = await db.member.findMany({
    where: { category: "DANCER", team },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      registerNumber: true,
      email: true,
      position: true,
      skillLevel: true,
    },
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-white">Roster</h1>
      <p className="text-purple-200/60 text-sm mt-1">
        Add dancers, set their skill level, and remove them from {team}.
      </p>

      {dance.isCommittee && (
        <div className="mt-4 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/roster?team=${encodeURIComponent(t)}`}
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
        <RosterClient
          team={team}
          dancers={dancers}
          selfId={dance.member.id}
        />
      </div>
    </div>
  );
}

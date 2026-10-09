import Link from "next/link";
import { redirect } from "next/navigation";
import { getDanceUser, pageTeam } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";
import StageHeader from "@/components/dance/StageHeader";
import TeamAnalyticsView from "@/components/dance/TeamAnalyticsView";
import NoAccess from "@/components/dance/NoAccess";

// A Dance Lead sees their own team; the committee picks any team.
export default async function DanceAnalyticsPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.seesAllTeams) {
    return <NoAccess title="Team insights are for Team Leaders" body="Only your team's Team Leader and the Super Admin can open this page. Your rehearsals, performances, attendance and timetable are in the menu." />;
  }

  // Committee: the chosen tab, else their own team if they dance. Others: their own team.
  const team = pageTeam(dance, searchParams.team);

  if (!team) {
    return (
      <div className="p-8 text-sm text-orange-100/70">
        You are not assigned to a dance team yet. Ask the committee to set your team.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <StageHeader
        eyebrow={team}
        title="Team"
        accent="insights"
        subtitle="How your team is showing up, and when everyone can rehearse."
      />

      {dance.seesAllTeams && (
        <div className="-mt-3 mb-6 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/analytics?team=${encodeURIComponent(t)}`}
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

      <TeamAnalyticsView team={team} />
    </div>
  );
}

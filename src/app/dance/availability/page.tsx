import Link from "next/link";
import { redirect } from "next/navigation";
import { getDanceUser, pageTeam } from "@/lib/dance";
import { DANCER_TEAMS } from "@/lib/teams";
import StageHeader from "@/components/dance/StageHeader";
import AvailabilityView from "@/components/dance/AvailabilityView";
import NoAccess from "@/components/dance/NoAccess";

// Timetable analytics. Team Leader: own team only. SuperAdmin (and the read-only Advisory): any
// team via the tabs. Normal Dancers, and Core members who dance as Normal Dancers, are sent back.
// The API re-checks all of this, so editing ?team= in the address bar changes nothing for a Lead.
export default async function DanceAvailabilityPage({
  searchParams,
}: {
  searchParams: { team?: string };
}) {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  if (!dance.isLead && !dance.seesAllTeams) {
    return <NoAccess title="Team availability is for Team Leaders" body="Only your team's Team Leader and the Super Admin can open this page. Your rehearsals, performances, attendance and timetable are in the menu." />;
  }

  const team = pageTeam(dance, searchParams.team);
  if (!team) {
    return (
      <div className="p-8 text-sm text-orange-100/70">
        You are not assigned to a dance team yet. Ask the committee to set your team.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <StageHeader
        eyebrow={team}
        title="Team"
        accent="availability"
        subtitle="When your dancers are free, from their timetables. Hover or tap any slot to see who can make it."
      />

      {dance.seesAllTeams && (
        <div className="-mt-3 mb-6 flex flex-wrap gap-2">
          {DANCER_TEAMS.map((t) => (
            <Link
              key={t}
              href={`/dance/availability?team=${encodeURIComponent(t)}`}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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

      <AvailabilityView team={team} />
    </div>
  );
}

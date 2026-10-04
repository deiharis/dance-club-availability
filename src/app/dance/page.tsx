import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDanceUser } from "@/lib/dance";

export default async function DanceDashboardPage() {
  const dance = await getDanceUser();
  if (!dance) redirect("/login");
  const { member, isSuper, isLead } = dance;

  const isDancer = member.category === "DANCER";

  // Dancers/Leads: their own team. SuperAdmin and Core: every team.
  const teamCounts =
    isDancer && !isSuper
      ? []
      : await db.member.groupBy({
          by: ["team"],
          where: { category: "DANCER" },
          _count: true,
        });

  const teamSize =
    isDancer && member.team
      ? await db.member.count({
          where: { category: "DANCER", team: member.team },
        })
      : 0;

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
        Welcome, {member.fullName}
      </h1>

      {isDancer ? (
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Card label="Team" value={member.team ?? "Not assigned"} />
          <Card
            label="Role"
            value={isLead ? "Dance Lead" : member.position ?? "Dancer"}
          />
          <Card
            label="Skill level"
            value={member.skillLevel === "PROFESSIONAL" ? "Professional" : "Amateur"}
          />
          <Card label="Team size" value={String(teamSize)} />
        </div>
      ) : null}

      {teamCounts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-purple-200/70 mb-3">
            Dancers per team
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {teamCounts.map((t) => (
              <Card
                key={t.team ?? "none"}
                label={t.team ?? "No team"}
                value={String(t._count)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-fuchsia-950 bg-[#140a1f] p-4">
      <p className="text-purple-300/50 text-xs">{label}</p>
      <p className="text-white text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

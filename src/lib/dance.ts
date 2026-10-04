import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Who is calling? null = not logged in. Reads the member from the DB (not the JWT)
// so team/position changes apply instantly.
export async function getCaller() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user) return null;

  const member = await db.member.findUnique({ where: { userId: user.id } });
  const role = user.role as string;
  const isSuper = role === "SUPERADMIN";
  const isLead =
    member?.category === "DANCER" && member.position === "Team Leader";
  // Committee = SuperAdmin or a non-dancer admin (Core). Dance Leads are NOT committee.
  const isCommittee =
    isSuper || (role === "ADMIN" && member?.category !== "DANCER");

  return {
    userId: user.id as string,
    role,
    member,
    isSuper,
    isLead,
    isCommittee,
    // SuperAdmin and committee manage every team; a Lead only their own.
    canManage: (team: string | null) =>
      isCommittee || (isLead && !!team && member?.team === team),
  };
}

export type Caller = NonNullable<Awaited<ReturnType<typeof getCaller>>>;

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });
export const forbidden = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Call at the top of every /api/dance/* route. Needs a linked member.
export async function getDanceUser() {
  const caller = await getCaller();
  if (!caller?.member) return null;
  return { ...caller, member: caller.member };
}

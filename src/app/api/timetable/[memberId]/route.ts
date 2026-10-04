import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

export const dynamic = "force-dynamic";

// Allowed: your own timetable, anyone's if you are committee/SuperAdmin,
// or a dancer in your team if you are that team's Dance Lead.
async function authorize(memberId: string) {
  const caller = await getCaller();
  if (!caller) return { res: unauthorized() };

  if (caller.member?.id === memberId || caller.isCommittee) return { caller };

  if (caller.isLead) {
    const target = await db.member.findUnique({ where: { id: memberId } });
    if (target?.category === "DANCER" && caller.canManage(target.team)) {
      return { caller };
    }
  }
  return { res: forbidden() };
}

export async function GET(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const auth = await authorize(params.memberId);
    if ("res" in auth) return auth.res;

    const entries = await db.timetableEntry.findMany({
      where: { memberId: params.memberId },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const auth = await authorize(params.memberId);
    if ("res" in auth) return auth.res;

    const { day, slot, status } = await req.json();

    const entry = await db.timetableEntry.upsert({
      where: {
        memberId_day_slot: {
          memberId: params.memberId,
          day,
          slot,
        },
      },
      update: { status },
      create: {
        memberId: params.memberId,
        day,
        slot,
        status,
      },
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

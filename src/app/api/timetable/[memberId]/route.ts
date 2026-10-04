import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

export const dynamic = "force-dynamic";

// Allowed: your own timetable, anyone's if you are committee/SuperAdmin, or, for a team's
// Dance Lead, any teammate's. A Lead may READ every teammate's timetable (including Core members
// who also dance) but may only EDIT pure dancers'; committee members manage their own.
async function authorize(memberId: string, write: boolean) {
  const caller = await getCaller();
  if (!caller) return { res: unauthorized() };

  if (caller.member?.id === memberId || caller.isCommittee) return { caller };

  if (caller.isLead) {
    const target = await db.member.findUnique({ where: { id: memberId } });
    if (target?.team && caller.canManage(target.team) && (!write || target.category === "DANCER")) {
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
    const auth = await authorize(params.memberId, false);
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
    const auth = await authorize(params.memberId, true);
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

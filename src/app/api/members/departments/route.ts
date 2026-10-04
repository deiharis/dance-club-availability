import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";

export const dynamic = "force-dynamic";

// Which stored department spellings differ from their canonical form, and how many members use each.
async function findChanges() {
  const groups = await db.member.groupBy({ by: ["department"], _count: true });
  return groups
    .map((g) => ({ from: g.department, to: normalizeDepartment(g.department).label, count: g._count }))
    .filter((c) => c.to && c.to !== c.from)
    .sort((a, b) => b.count - a.count);
}

// Preview only: nothing is changed.
export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    return NextResponse.json({ changes: await findChanges() });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Apply every change from the preview.
export async function POST() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isCommittee) return forbidden();

  try {
    const changes = await findChanges();
    let updated = 0;
    for (const c of changes) {
      const r = await db.member.updateMany({ where: { department: c.from }, data: { department: c.to } });
      updated += r.count;
    }
    return NextResponse.json({ updated });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

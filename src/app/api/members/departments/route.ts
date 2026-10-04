import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { normalizeDepartment } from "@/lib/departments";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

type Change = { field: "Department" | "Phone"; from: string; to: string; count: number };

// Stored spellings that differ from their standard form, for departments and phone numbers.
async function findChanges(): Promise<Change[]> {
  const [depts, phones] = await Promise.all([
    db.member.groupBy({ by: ["department"], _count: true }),
    db.member.groupBy({ by: ["phone"], _count: true, where: { phone: { not: null } } }),
  ]);

  const out: Change[] = [];
  for (const g of depts) {
    const to = normalizeDepartment(g.department).label;
    if (to && to !== g.department) out.push({ field: "Department", from: g.department, to, count: g._count });
  }
  for (const g of phones) {
    const from = g.phone ?? "";
    const to = normalizePhone(from);
    if (to && to !== from) out.push({ field: "Phone", from, to, count: g._count });
  }
  return out.sort((a, b) => b.count - a.count);
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
    let updated = 0;
    for (const c of await findChanges()) {
      const r =
        c.field === "Department"
          ? await db.member.updateMany({ where: { department: c.from }, data: { department: c.to } })
          : await db.member.updateMany({ where: { phone: c.from }, data: { phone: c.to } });
      updated += r.count;
    }
    return NextResponse.json({ updated });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

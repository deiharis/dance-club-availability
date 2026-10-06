import { NextResponse } from "next/server";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";
import { listProgrammeIssues, notifyProgrammeIssues } from "@/lib/programme-issues";

export const dynamic = "force-dynamic";

// SuperAdmin only. GET -> members whose Department/Course needs fixing (count + list).
// POST -> notify those who have not been told yet (never notifies anyone twice).
export async function GET() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isSuper) return forbidden();
  const members = await listProgrammeIssues();
  return NextResponse.json({ count: members.length, members });
}

export async function POST() {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isSuper) return forbidden();
  const notified = await notifyProgrammeIssues();
  return NextResponse.json({ notified });
}

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCaller, unauthorized, forbidden } from "@/lib/dance";

export const dynamic = "force-dynamic";

// POST /api/members/[id]/password  - SuperAdmin only.
// Resets a forgotten password to the member's register number (capitals, same as imported
// accounts) and forces them to pick a new one at their next login (middleware -> /change-password).
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const caller = await getCaller();
  if (!caller) return unauthorized();
  if (!caller.isSuper) return forbidden();

  const member = await db.member.findUnique({
    where: { id: params.id },
    select: { userId: true, fullName: true, registerNumber: true },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  // Your own password is changed from the key icon, so you can never lock yourself out here.
  if (member.userId === caller.userId) {
    return NextResponse.json(
      { error: "Use the key icon in the sidebar to change your own password" },
      { status: 400 }
    );
  }

  const tempPassword = member.registerNumber.trim().toUpperCase();
  try {
    await db.user.update({
      where: { id: member.userId },
      data: { password: await bcrypt.hash(tempPassword, 12), mustChangePassword: true },
    });
    return NextResponse.json({ tempPassword, fullName: member.fullName });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Change your own password. Clears the "must change password" flag.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Both passwords are required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current one" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      include: { member: { select: { registerNumber: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // The temporary password is the register number, so it must not be reused.
    if (user.member && newPassword.toLowerCase() === user.member.registerNumber.toLowerCase()) {
      return NextResponse.json(
        { error: "Choose something other than your register number" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 12), mustChangePassword: false },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

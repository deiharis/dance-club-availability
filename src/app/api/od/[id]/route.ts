import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SuperAdmin can approve OD
    if ((session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Only the Super Admin can approve OD requests" },
        { status: 403 }
      );
    }

    const { action } = await req.json();

    if (action !== "APPROVE") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const odRequest = await db.oDRequest.findUnique({
      where: { id: params.id },
    });

    if (!odRequest) {
      return NextResponse.json(
        { error: "OD request not found" },
        { status: 404 }
      );
    }

    if (odRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "This OD request is already approved" },
        { status: 400 }
      );
    }

    const updated = await db.oDRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const odRequest = await db.oDRequest.findUnique({
      where: { id: params.id },
      include: { member: true },
    });

    if (!odRequest) {
      return NextResponse.json(
        { error: "OD request not found" },
        { status: 404 }
      );
    }

    // Only the member who created it (if PENDING) or SuperAdmin can delete
    const isOwner = odRequest.member.userId === userId;
    const isSuperAdmin = role === "SUPERADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isOwner && odRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot withdraw an already approved OD request" },
        { status: 400 }
      );
    }

    await db.oDRequest.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
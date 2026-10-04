import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifySuperAdmins } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    if (role === "SUPERADMIN") {
      const requests = await db.oDRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          member: {
            select: {
              fullName: true,
              registerNumber: true,
              department: true,
              category: true,
              position: true,
            },
          },
          report: {
            select: {
              description: true,
              workDate: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              eventDate: true,
            },
          },
        },
      });
      return NextResponse.json(requests);
    }

    const member = await db.member.findUnique({ where: { userId } });
    if (!member) {
      return NextResponse.json([], { status: 200 });
    }

    const requests = await db.oDRequest.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      include: {
        report: {
          select: {
            description: true,
            workDate: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
          },
        },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const member = await db.member.findUnique({ where: { userId } });
    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    if (member.category !== "CORE" && member.category !== "MEMBER") {
      return NextResponse.json(
        { error: "Only Core Members and Normal Members can request OD" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reportId, reason, slots, eventId } = body;

    if (!reportId || !reason?.trim()) {
      return NextResponse.json(
        { error: "Report and reason are required" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Please select an event for this OD request" },
        { status: 400 }
      );
    }

    const report = await db.report.findUnique({ where: { id: reportId } });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    if (report.memberId !== member.id) {
      return NextResponse.json(
        { error: "You can only request OD for your own reports" },
        { status: 403 }
      );
    }

    if (report.status !== "APPROVED") {
      return NextResponse.json(
        { error: "OD can only be requested for approved reports" },
        { status: 400 }
      );
    }

    const existing = await db.oDRequest.findUnique({ where: { reportId } });
    if (existing) {
      return NextResponse.json(
        { error: "An OD request already exists for this report" },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await db.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json(
        { error: "Selected event not found" },
        { status: 404 }
      );
    }

    const odRequest = await db.oDRequest.create({
      data: {
        memberId: member.id,
        reportId,
        reason: reason.trim(),
        activityDate: report.workDate,
        slots: Array.isArray(slots) ? slots : [],
        eventId,
      },
    });

    await notifySuperAdmins({
      actorMemberId: member.id,
      type: "OD_REQUESTED",
      message: `${member.fullName} requested OD for ${event.name}.`,
      link: "/od",
    });

    return NextResponse.json(odRequest, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
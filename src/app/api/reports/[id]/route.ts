import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

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

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reviewer = await db.member.findUnique({ where: { userId } });
    if (!reviewer) {
      return NextResponse.json(
        { error: "Reviewer profile not found" },
        { status: 404 }
      );
    }

    const report = await db.report.findUnique({
      where: { id: params.id },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Prevent self-approval
    if (report.memberId === reviewer.id) {
      return NextResponse.json(
        { error: "You cannot approve or reject your own report" },
        { status: 403 }
      );
    }

    const { action, reviewNotes } = await req.json();

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Action must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    // Delete image from Supabase Storage after review
    if (report.imagePath) {
      await supabaseAdmin.storage
        .from("report-images")  
        .remove([report.imagePath]);
    }

    // Update report + create notification in one transaction
    const [updatedReport] = await db.$transaction([
      db.report.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          reviewNotes: reviewNotes || null,
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
          imageUrl: "",
          imagePath: "",
        },
      }),
      db.notification.create({
        data: {
          type: newStatus === "APPROVED" ? "REPORT_APPROVED" : "REPORT_REJECTED",
          message:
            newStatus === "APPROVED"
              ? "Your report has been approved."
              : `Your report was rejected. ${reviewNotes ? `Reason: ${reviewNotes}` : "No reason provided."}`,
          memberId: report.memberId,
          reportId: params.id,
        },
      }),
    ]);

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
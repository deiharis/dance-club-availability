import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getCaller } from "@/lib/dance";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function getSignedUrl(imagePath: string): Promise<string> {
  if (!imagePath) return "";

  const { data, error } = await supabaseAdmin.storage
    .from("report-images")
    .createSignedUrl(imagePath, 60 * 30);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    return "";
  }

  return data.signedUrl;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const caller = await getCaller();

    // Committee: every report. Dance Lead: reports from their own team's dancers
    // (never their own). Everyone else: only their own, handled below.
    if (caller && (caller.isCommittee || caller.isLead)) {
      const reports = await db.report.findMany({
        where: caller.isCommittee
          ? // Normal dancers' reports are reviewed by their Lead only; the committee
            // still reviews Dance Leads' own reports.
            {
              NOT: {
                member: { category: "DANCER", position: { not: "Team Leader" } },
              },
            }
          : {
              member: {
                category: "DANCER",
                team: caller.member?.team ?? "__none__",
                id: { not: caller.member?.id },
              },
            },
        orderBy: { submittedAt: "desc" },
        include: {
          member: {
            select: {
              fullName: true,
              registerNumber: true,
              category: true,
              position: true,
              isFFCS: true,
            },
          },
          reviewedBy: {
            select: {
              fullName: true,
              position: true,
              category: true,
            },
          },
        },
      });

      const reportsWithSignedUrls = await Promise.all(
        reports.map(async (report) => {
          if (report.status === "PENDING" && report.imagePath) {
            const signedUrl = await getSignedUrl(report.imagePath);
            return { ...report, imageUrl: signedUrl };
          }
          return { ...report, imageUrl: "" };
        })
      );

      return NextResponse.json(reportsWithSignedUrls);
    } else {
      const member = await db.member.findUnique({
        where: { userId },
      });

      if (!member) {
        return NextResponse.json([], { status: 200 });
      }

      const reports = await db.report.findMany({
        where: { memberId: member.id },
        orderBy: { submittedAt: "desc" },
      });

      return NextResponse.json(reports);
    }
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

    const userId = (session.user as any).id;

    const member = await db.member.findUnique({
      where: { userId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member profile not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const description = formData.get("description") as string;
    const workDate = formData.get("workDate") as string;
    const image = formData.get("image") as File;

    if (!description || !workDate || !image) {
      return NextResponse.json(
        { error: "Description, work date, and image are required" },
        { status: 400 }
      );
    }

    if (!image.type?.startsWith("image/")) {
      return NextResponse.json(
        { error: "The proof must be an image file" },
        { status: 400 }
      );
    }

    const fileExt = image.name.split(".").pop();
    const fileName = `${member.id}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("report-images")
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log("Upload success:", uploadData.path);

    const report = await db.report.create({
      data: {
        description,
        workDate: new Date(workDate),
        imageUrl: "",
        imagePath: fileName,
        memberId: member.id,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
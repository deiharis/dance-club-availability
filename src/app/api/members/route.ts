import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const members = await db.member.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(members);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      registerNumber,
      email,
      phone,
      department,
      academicYear,
      category,
      position,
      password,
    } = body;

    if (
      !fullName ||
      !registerNumber ||
      !email ||
      !department ||
      !position ||
      !password ||
      !category
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A member with this email already exists" },
        { status: 400 }
      );
    }

    const existingMember = await db.member.findUnique({
      where: { registerNumber },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "A member with this register number already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role: category === "CORE" ? "ADMIN" : "MEMBER",
        member: {
          create: {
            fullName,
            registerNumber,
            email,
            phone: phone || null,
            department,
            academicYear: parseInt(academicYear),
            category,
            position,
          },
        },
      },
      include: { member: true },
    });

    return NextResponse.json(user.member, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUPERADMIN_EMAIL = "harisahamed.b2024@vitstudent.ac.in";
const SUPERADMIN_PASSWORD = "harisahamed.b2024";

async function main() {
  console.log("Running seed...");

  // ── SUPERADMIN ─────────────────────────────────────────
  // Always upsert so future seed runs never create duplicates
  // and always ensure the role stays SUPERADMIN
  const hashedSuperPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

  const existingSuperUser = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
    include: { member: true },
  });

  if (existingSuperUser) {
    // Account already exists — update role and password only
    // Preserve all existing member data
    await prisma.user.update({
      where: { email: SUPERADMIN_EMAIL },
      data: {
        password: hashedSuperPassword,
        role: "SUPERADMIN",
      },
    });
    console.log(`✅ SUPERADMIN updated: ${SUPERADMIN_EMAIL}`);
    console.log(`   Member data preserved: ${existingSuperUser.member?.fullName ?? "no member linked"}`);
  } else {
    // Account does not exist — create fresh
    await prisma.user.create({
      data: {
        email: SUPERADMIN_EMAIL,
        password: hashedSuperPassword,
        role: "SUPERADMIN",
        member: {
          create: {
            fullName: "Haris Ahamed",
            registerNumber: "SUPER001",
            email: SUPERADMIN_EMAIL,
            department: "Core Team",
            academicYear: 1,
            category: "CORE",
            isFFCS: false,
            position: "President",
          },
        },
      },
    });
    console.log(`✅ SUPERADMIN created: ${SUPERADMIN_EMAIL}`);
  }

  // ── REMOVE OLD DEFAULT ADMIN ────────────────────────────
  // admin@danceclub.com was a placeholder — remove it cleanly
  // This deletes the user AND cascades to the linked member
  const oldAdmin = await prisma.user.findUnique({
    where: { email: "admin@danceclub.com" },
  });

  if (oldAdmin) {
    await prisma.user.delete({
      where: { email: "admin@danceclub.com" },
    });
    console.log("✅ Old default admin removed: admin@danceclub.com");
  } else {
    console.log("ℹ️  Old default admin not found — nothing to remove");
  }

  console.log("");
  console.log("─────────────────────────────────────────");
  console.log("Seed complete.");
  console.log("");
  console.log("SUPERADMIN credentials:");
  console.log(`  Email:    ${SUPERADMIN_EMAIL}`);
  console.log(`  Password: ${SUPERADMIN_PASSWORD}`);
  console.log("─────────────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
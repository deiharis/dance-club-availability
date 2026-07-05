import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "harisahamed.b2024@vitstudent.ac.in" },
    include: { member: true },
  });

  if (!user) {
    console.log("❌ Account not found. Check the email is correct in the database.");
    return;
  }

  await prisma.user.update({
    where: { email: "harisahamed.b2024@vitstudent.ac.in" },
    data: { role: "SUPERADMIN" },
  });

  console.log("✅ SUPERADMIN role granted to harisahamed.b2024@vitstudent.ac.in");
  console.log(`   Member name: ${user.member?.fullName ?? "no member linked"}`);
  console.log("   All existing data preserved.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
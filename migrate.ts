import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration...");

  // Convert all old FFCS members to FFCS_ONLY + isFFCS = true
  const updated = await prisma.member.updateMany({
    where: {
      category: "FFCS_ONLY",
      isFFCS: false,
    },
    data: {
      isFFCS: true,
    },
  });

  console.log(`✅ Migrated ${updated.count} FFCS members`);

  // Set isFFCS = true for all FFCS_ONLY members
  // (safety pass in case any were missed)
  await prisma.member.updateMany({
    where: { category: "FFCS_ONLY" },
    data: { isFFCS: true },
  });

  console.log("✅ Migration complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
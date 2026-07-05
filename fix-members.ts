import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking members...");

  const members = await prisma.member.findMany();
  console.log(`Found ${members.length} members`);

  // Clear positions so they can be set fresh from the UI
  const updated = await prisma.member.updateMany({
    data: {
      position: null,
      team: null,
    },
  });

  console.log(`✅ Reset position and team for ${updated.count} members`);
  console.log("Members can now be edited from the website to set their positions.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: {
      email: "admin@danceclub.com",
    },
    update: {},
    create: {
      email: "admin@danceclub.com",
      password: hashedPassword,
      role: "ADMIN",
      member: {
        create: {
          fullName: "Admin User",
          registerNumber: "ADMIN001",
          email: "admin@danceclub.com",
          department: "Core Team",
          academicYear: 1,
          category: "CORE",
          position: "President",
        },
      },
    },
  });

  console.log("✅ Admin user created");
  console.log("Email: admin@danceclub.com");
  console.log("Password: admin123");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
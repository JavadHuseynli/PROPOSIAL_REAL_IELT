import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@ielts.az" },
    update: {},
    create: {
      email: "admin@ielts.az",
      password: hashedPassword,
      name: "System Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed completed: admin@ielts.az / admin123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

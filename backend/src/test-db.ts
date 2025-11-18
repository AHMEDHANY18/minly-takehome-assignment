// src/test-db.ts
import { prisma } from "./config/prisma";

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test322@example.com",
      passwordHash: "hashed-password",
    },
  });

  console.log("Created user:", user);

  const users = await prisma.user.findMany();
  console.log("All users:", users);
}

main()
  .catch((err) => {
    console.error("Error in test-db:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

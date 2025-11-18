// src/config/prisma.ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// لو حابب تقفل الconnection لما السيرفر يقفل
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

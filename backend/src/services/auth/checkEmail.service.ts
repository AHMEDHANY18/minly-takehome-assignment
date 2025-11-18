import { prisma } from "../../config/prisma";

export async function checkEmailService(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  return { exists: !!user };
}

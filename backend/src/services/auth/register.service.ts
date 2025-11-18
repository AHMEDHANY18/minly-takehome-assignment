import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { jwtSign } from "../../utilities/encryption/jwtSign";
import { formatUser } from "../../utilities/formatUser";

export async function registerService(name: string, email: string, password: string) {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    throw new Error("Email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  // 🔥 استخدم الـ helper بتاعك
  const token = jwtSign({ userId: user.id }, { expiresIn: "7d" });

  return { user: formatUser(user), token };
}

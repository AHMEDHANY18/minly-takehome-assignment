import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { jwtSign } from "../../utilities/encryption/jwtSign";
import { formatUser } from "../../utilities/formatUser";

export async function registerService(
  name: string,
  email: string,
  password: string
) {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    const err: any = new Error("Email already exists");
    err.statusCode = 400;           // 👈 مهم جداً
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  const token = jwtSign({ userId: user.id }, { expiresIn: "7d" });

  return { user: formatUser(user), token };
}

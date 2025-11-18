import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { jwtSign } from "../../utilities/encryption/jwtSign";
import { formatUser } from "../../utilities/formatUser";

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  const token = jwtSign({ userId: user.id }, { expiresIn: "7d" });

  return { user: formatUser(user), token };
}

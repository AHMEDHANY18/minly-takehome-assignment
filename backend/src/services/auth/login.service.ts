import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { jwtSign } from "../../utilities/encryption/jwtSign";
import { formatUser } from "../../utilities/formatUser";

export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const err: any = new Error("Invalid email or password");
    err.status = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err: any = new Error("Invalid email or password");
    err.status = 400;
    throw err;
  }

  const token = jwtSign({ userId: user.id }, { expiresIn: "7d" });

  return {
    user: formatUser(user),
    token,
  };
}

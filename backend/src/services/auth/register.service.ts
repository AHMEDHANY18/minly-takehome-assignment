import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { jwtSign } from "../../utilities/encryption/jwtSign";
import { formatUser } from "../../utilities/formatUser";
import { Prisma } from "@prisma/client";

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
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
  } catch (error: any) {
    if (
      //Race Condition
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const err: any = new Error("Email already exists");
      err.status = 400;
      throw err;
    }
    throw error;
  }

  const token = jwtSign({ userId: user.id }, { expiresIn: "7d" });

  return { user: formatUser(user), token };
}

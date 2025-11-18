// src/utilities/helpers/encryption/jwtVerify.ts
import { verify } from "jsonwebtoken";

export const jwtVerify = async (token: string): Promise<any | false> => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const decoded = await new Promise((resolve, reject) => {
      verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });
    console.log("🚀 ~ decoded ~ decoded:", decoded)

    return decoded;
  } catch (err: any) {
    console.error("خطأ في التحقق من التوكين:", err.message);
    return false;
  }
};

// src/utilities/helpers/encryption/jwtSign.ts
import jwt from "jsonwebtoken";

type Payload = string | object | Buffer;

export const jwtSign = (
  payload: Payload,
  options: jwt.SignOptions = { expiresIn: "1y" }
): string => {
  if (!payload) {
    throw new Error("Payload is required");
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign(payload, secret, options);
};

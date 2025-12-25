// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();
function parseOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return ["http://localhost:5173"];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
const allowedOrigins = parseOrigins();
const vercelRegex =
  /^https:\/\/minly-takehome-assignment-3cpo(?:-[a-z0-9-]+)?\.vercel\.app$/i;

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),

  cors: {
    origin(
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (vercelRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    credentials: true,
  },
} as const;

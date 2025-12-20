// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();

function parseOrigins() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return ["http://localhost:5173"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const allowedOrigins = parseOrigins();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),

  cors: {
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // allow non-browser clients (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  },
} as const;

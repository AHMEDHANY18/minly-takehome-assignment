// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();

/**
 * Parse static allowed origins from env
 * مثال:
 * CORS_ORIGINS=http://localhost:5173,https://minly-takehome-assignment-3cpo.vercel.app
 */
function parseOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return ["http://localhost:5173"];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins();

/**
 * Regex يسمح:
 * - production Vercel domain
 * - preview domains تلقائيًا
 */
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
      /**
       * Requests بدون Origin
       * (زي health checks / server-to-server)
       */
      if (!origin) {
        return callback(null, true);
      }

      /**
       * Allow explicit origins from env
       */
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      /**
       * Allow Vercel production + preview domains
       */
      if (vercelRegex.test(origin)) {
        return callback(null, true);
      }

      /**
       * Block everything else
       */
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    credentials: true,
  },
} as const;

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  cors: {
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      const allowedOrigins = ["http://localhost:5173"];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
} as const;
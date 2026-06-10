// src/config/redis.ts
import { initRedisClient, getRedisClient } from "cache-center";
import logger from "./logger";

let redisEnabled = false;

function resolveRedisConfig(): {
  host: string;
  port: number;
  password?: string;
} | null {
  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || "6379", 10),
        password: parsed.password || undefined,
      };
    } catch {
      logger.warn("Invalid REDIS_URL; caching disabled");
      return null;
    }
  }

  if (process.env.REDIS_HOST) {
    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
    };
  }

  return null;
}

const redisConfig = resolveRedisConfig();

if (redisConfig) {
  try {
    initRedisClient({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      connectTimeout: 10000,
    });
    redisEnabled = true;
  } catch {
    logger.warn("Redis init failed; caching disabled");
  }
} else {
  logger.warn("REDIS_URL / REDIS_HOST not set; caching disabled");
}

/**
 * Best-effort cache get. Never throws — returns null when Redis is
 * unavailable / not configured.
 */
export async function cacheGet(key: string): Promise<string | null> {
  if (!redisEnabled) return null;
  try {
    const client = getRedisClient();
    if (!client.isOpen) return null;
    return await client.get(key);
  } catch {
    return null;
  }
}

/**
 * Best-effort cache set with TTL (seconds). Never throws.
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  if (!redisEnabled) return;
  try {
    const client = getRedisClient();
    if (!client.isOpen) return;
    await client.setEx(key, ttlSeconds, value);
  } catch {
    // ignore — caching is optional
  }
}

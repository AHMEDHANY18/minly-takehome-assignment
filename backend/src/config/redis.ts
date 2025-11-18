import { initRedisClient } from "cache-center";

initRedisClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 10000,
}); 
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import logger from "./config/logger";
import { config } from "./config";

// لو config.port مش متضبوطة، خليه 4000
const PORT = config.port || 4000;

// تشغيل السيرفر
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is running on http://localhost:${PORT}`);
});

// لو فيه Promise مفيهوش catch
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// لو فيه error مش متلَقط
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

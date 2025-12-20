// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { preventHPP } from "./middleware/preventHPP";
import { errorHandler } from "./middleware/errorHandler";
import logger, { stream } from "./config/logger";
import { config } from "./config";
import router from "./routes";

const app = express();

// IMPORTANT behind proxies (Render, Nginx, etc.)
app.set("trust proxy", 1);

/* ---------------- Security ---------------- */
app.use(cookieParser());
app.use(helmet());

// CORS must be before routes + withCredentials
app.use(cors(config.cors));
app.options("*", cors(config.cors));

app.use(preventHPP);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests",
});
app.use(globalLimiter);

/* ---------------- Body parsing ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- Logger ---------------- */
app.use(morgan("combined", { stream }));

/* ---------------- Routes ---------------- */
app.use("/", router);

/* ---------------- Error Handler ---------------- */
app.use(errorHandler);

export default app;

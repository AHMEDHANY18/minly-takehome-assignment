import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { preventHPP } from "./middleware/preventHPP";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { stream } from "./config/logger";
import { config } from "./config";
import router from "./routes";

const app = express();

// IMPORTANT behind proxies (Render, Nginx, etc.)
app.set("trust proxy", 1);

/* ---------------- Security ---------------- */
app.use(cookieParser());
app.use(helmet());

app.use(cors(config.cors));
app.options("*", cors(config.cors));

app.use(preventHPP);

/* ---------------- Rate limit ---------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests",
});

// ✅ Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests",
  skip: (req) => req.path.startsWith("/v1/auth"),
});

app.use(globalLimiter);
app.use("/v1/auth", authLimiter);

/* ---------------- Body parsing ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- Logger ---------------- */
app.use(morgan("combined", { stream }));

/* ---------------- Request id + metrics ---------------- */
app.use(requestLogger);

/* ---------------- Routes ---------------- */
app.use("/", router);

/* ---------------- Error Handler ---------------- */
app.use(errorHandler);

export default app;

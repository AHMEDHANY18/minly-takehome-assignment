import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { preventHPP } from "./middleware/preventHPP";
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

// ✅ Limiter منفصل للـ auth (أوسع لأن فيه redirects/callback)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests",
});

// ✅ Global limiter لباقي الـ API (واستثناء auth)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests",
  skip: (req) => req.path.startsWith("/v1/auth"),
});

app.use(globalLimiter);

// مهم: ركّب authLimiter قبل الراوتر العام
app.use("/v1/auth", authLimiter);

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

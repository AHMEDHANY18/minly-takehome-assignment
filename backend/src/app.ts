import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { preventHPP } from "./middleware/preventHPP";
import { errorHandler } from "./middleware/errorHandler";
import logger, { stream } from "./config/logger";
import { config } from "./config";
import router from "./routes";
import cookieParser from "cookie-parser";

const app = express();

/* ---------------- Security ---------------- */

app.use(cookieParser());
app.use(helmet());
app.use(cors(config.cors));
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

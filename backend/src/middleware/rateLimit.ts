import rateLimit from "express-rate-limit";

// ⛔ 5 attempts per 1 minute (login/register)
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many attempts, please try again later.",
  },
});

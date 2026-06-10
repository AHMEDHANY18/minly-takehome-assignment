// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import logger from "../config/logger";
import { recordRequest } from "../observability/metrics";

// long-lived SSE connections would distort duration metrics — skip them
const SSE_PATH_SUFFIX = "/notification/stream";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  req.id = randomUUID();

  if (req.path.endsWith(SSE_PATH_SUFFIX)) {
    return next();
  }

  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    // route pattern when matched (e.g. /v1/media/:mediaId/details), raw path otherwise
    const routePattern = req.route
      ? `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}`
      : null;

    recordRequest(
      `${req.method} ${routePattern ?? "<unmatched>"}`,
      res.statusCode,
      durationMs
    );

    logger.info("http_request", {
      reqId: req.id,
      method: req.method,
      route: routePattern ?? req.path,
      status: res.statusCode,
      durationMs,
      userId: (req as any).user?.id,
    });
  });

  return next();
}

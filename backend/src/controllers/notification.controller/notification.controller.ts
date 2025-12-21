import { Response } from "express";
import { AuthRequest } from "../../middleware/auth/types";
import { NotificationStream } from "../../realtime/notification.stream";

export function notificationStreamController(req: AuthRequest, res: Response) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // مفيد ضد buffering


  res.flushHeaders();

  // keep-alive ping (اختياري لكنه مفيد)
  const ping = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 25_000);

  NotificationStream.add(user.id, res);

  req.on("close", () => {
    clearInterval(ping);
    NotificationStream.remove(user.id, res);
  });
}

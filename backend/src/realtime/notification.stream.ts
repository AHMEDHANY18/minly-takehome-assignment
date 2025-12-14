import { Response } from "express";

type SSEClient = {
  res: Response;
};

const clients = new Map<string, SSEClient[]>();

export const NotificationStream = {
  add(userId: string, res: Response) {
    if (!clients.has(userId)) {
      clients.set(userId, []);
    }

    clients.get(userId)!.push({ res });
  },

  remove(userId: string, res: Response) {
    const list = clients.get(userId);
    if (!list) return;

    clients.set(
      userId,
      list.filter((c) => c.res !== res)
    );
  },

  emit(userId: string, payload: any) {
    const list = clients.get(userId);
    if (!list) return;

    for (const { res } of list) {
      res.write(`event: notification\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  },

  // optional keep-alive
  ping(userId: string) {
    const list = clients.get(userId);
    if (!list) return;

    for (const { res } of list) {
      res.write(`event: ping\ndata: {}\n\n`);
    }
  },
};

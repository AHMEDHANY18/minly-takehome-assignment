import { useEffect, useRef } from "react";
import {
  useNotificationStore,
  type NotificationItem,
} from "@/features/notifications/store/notification.store";
import { useMessagesStore } from "@/features/messages/store/messages.store";
import type { MessageItem } from "@/features/messages/api/messages.api";

type StreamPayload =
  | (NotificationItem & { kind?: undefined })
  | { kind: "MESSAGE"; conversationId: string; message: MessageItem };

function dispatchPayload(
  raw: string,
  pushIncoming: (n: NotificationItem) => void
) {
  try {
    const payload = JSON.parse(raw) as StreamPayload;
    if (payload && (payload as { kind?: string }).kind === "MESSAGE") {
      const ev = payload as Extract<StreamPayload, { kind: "MESSAGE" }>;
      useMessagesStore.getState().pushIncoming(ev.conversationId, ev.message);
      return;
    }
    pushIncoming(payload as NotificationItem);
  } catch {
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://minly-takehome-assignment.onrender.com/v1";

export function useNotificationStream(enabled: boolean) {
  const esRef = useRef<EventSource | null>(null);

  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const setConnected = useNotificationStore((s) => s.setConnected);

  useEffect(() => {
    if (!enabled) {
      esRef.current?.close();
      esRef.current = null;
      setConnected(false);
      return;
    }

    const streamUrl = `${API_BASE_URL}/notification/stream`;
    const es = new EventSource(streamUrl, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (evt) => {
      dispatchPayload(evt.data, pushIncoming);
    };

    es.addEventListener("notification", (evt) => {
      dispatchPayload((evt as MessageEvent).data, pushIncoming);
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      setConnected(false);
      es.close();
      esRef.current = null;
    };
  }, [enabled, pushIncoming, setConnected]);
}

import { useEffect, useRef } from "react";
import {
  useNotificationStore,
  type NotificationItem,
} from "@/features/notifications/store/notification.store";

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
      console.log("[SSE] open");
    };

    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data) as NotificationItem;
        pushIncoming(payload);
      } catch {
      }
    };

    es.addEventListener("notification", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as NotificationItem;
        pushIncoming(payload);
      } catch {
      }
    });

    es.onerror = (e) => {
      setConnected(false);
      console.log("[SSE] error", e);
    };

    return () => {
      setConnected(false);
      es.close();
      esRef.current = null;
    };
  }, [enabled, pushIncoming, setConnected]);
}

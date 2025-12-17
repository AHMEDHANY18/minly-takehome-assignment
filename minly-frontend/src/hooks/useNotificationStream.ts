import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "../store/notification.store";

export function useNotificationStream(enabled: boolean) {
  const esRef = useRef<EventSource | null>(null);

  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const setConnected = useNotificationStore((s) => s.setConnected);

  useEffect(() => {
    if (!enabled) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setConnected(false);
      return;
    }

    // امنع فتح اتصالين
    if (esRef.current) return;

    console.log("[SSE] creating EventSource -> /v1/notification/stream");
    const es = new EventSource("/v1/notification/stream");
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      console.log("[SSE] open");
    };

    es.addEventListener("ping", () => {
      console.log("[SSE] ping");
    });

    es.addEventListener("notification", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as NotificationItem;
        console.log("[SSE] notification", payload);
        pushIncoming(payload);
      } catch {
        console.log("[SSE] bad notification payload");
      }
    });

    // fallback
    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data) as NotificationItem;
        console.log("[SSE] message", payload);
        pushIncoming(payload);
      } catch {
        console.log("[SSE] bad message payload", evt.data);
      }
    };

    es.onerror = (e) => {
      setConnected(false);
      console.log("[SSE] error", e);
    };

    return () => {
      console.log("[SSE] cleanup (close)");
      setConnected(false);
      es.close();
      esRef.current = null;
    };
  }, [enabled, pushIncoming, setConnected]);
}

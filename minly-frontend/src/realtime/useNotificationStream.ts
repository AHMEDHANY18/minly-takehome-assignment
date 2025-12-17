import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "../store/notification.store";

export function useNotificationStream(enabled: boolean) {
    console.log("[SSE hook] render", { enabled });
    const esRef = useRef<EventSource | null>(null);

    const pushIncoming = useNotificationStore((s) => s.pushIncoming);
    const setConnected = useNotificationStore((s) => s.setConnected);

    useEffect(() => {
      if (!enabled) return;

      const es = new EventSource("/v1/notification/stream"); // أو { withCredentials: true } لو cross-origin
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        console.log("[SSE] open");
      };

      // ✅ لو السيرفر بيبعت default message
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data) as NotificationItem;
          console.log("[SSE] message", payload);
          pushIncoming(payload);
        } catch (e) {
          console.log("[SSE] bad message payload", evt.data);
        }
      };

      // ✅ لو السيرفر بيبعت event: notification
      es.addEventListener("notification", (evt) => {
        try {
          const payload = JSON.parse((evt as MessageEvent).data) as NotificationItem;
          console.log("[SSE] notification", payload);
          pushIncoming(payload);
        } catch {
          console.log("[SSE] bad notification payload");
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


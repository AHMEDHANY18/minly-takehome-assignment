import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "../store/notification.store";
import { useNotificationSound } from "./useNotificationSound";

export function useNotificationStream(enabled: boolean) {
  console.log("[SSE hook] render", { enabled });

  const esRef = useRef<EventSource | null>(null);

  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const setConnected = useNotificationStore((s) => s.setConnected);

  // 🔊 الصوت
  const { play } = useNotificationSound();

  useEffect(() => {
    if (!enabled) {
      console.log("[SSE] disabled");
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

    // keep-alive
    es.addEventListener("ping", () => {
      console.log("[SSE] ping");
    });

    // 🔔 إشعار حقيقي
    es.addEventListener("notification", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as NotificationItem;
        console.log("[SSE] notification", payload);

        pushIncoming(payload);

        // 🔊 شغل الصوت (بشروط)
        if (!payload.isRead && !window.location.pathname.startsWith("/notifications")) {
            play();
          }
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
        if (!payload.isRead) play();
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
  }, [enabled, pushIncoming, setConnected, play]);
}

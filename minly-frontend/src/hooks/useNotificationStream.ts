import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "../store/notification.store";

export function useNotificationStream(enabled: boolean) {
  // DEBUG: يثبت إن الهـوك بيترندر أصلًا
  console.log("[SSE hook] render", { enabled });

  const esRef = useRef<EventSource | null>(null);

  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const setConnected = useNotificationStore((s) => s.setConnected);

  useEffect(() => {
    if (!enabled) {
      console.log("[SSE] disabled");
      // لو كان فيه اتصال قديم وقفّه
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

    // event: ping
    es.addEventListener("ping", () => {
      console.log("[SSE] ping");
    });

    // event: notification
    es.addEventListener("notification", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as NotificationItem;
        console.log("[SSE] notification", payload);
        pushIncoming(payload);
      } catch (e) {
        console.log("[SSE] bad notification payload", (evt as MessageEvent).data);
      }
    });

    // لو السيرفر بيبعت default message
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
      // EventSource بيحاول يعيد الاتصال تلقائيًا
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

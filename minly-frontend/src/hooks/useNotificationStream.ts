import { useEffect, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "../store/notification.store";

const API_BASE_URL = "https://minly-takehome-assignment.onrender.com/v1"; // أو import.meta.env

export function useNotificationStream(enabled: boolean) {
  const esRef = useRef<EventSource | null>(null);

  const pushIncoming = useNotificationStore((s) => s.pushIncoming);
  const setConnected = useNotificationStore((s) => s.setConnected);

  useEffect(() => {
    if (!enabled) {
      if (esRef.current) esRef.current.close();
      esRef.current = null;
      setConnected(false);
      return;
    }

    const streamUrl = `${API_BASE_URL}/notification/stream`;

    // مهم: لو الـ auth cookies cross-site لازم withCredentials
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
        // لو عندك ping / heartbeats هتدخل هنا عادي
      }
    };

    es.addEventListener("notification", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as NotificationItem;
        pushIncoming(payload);
      } catch {}
    });

    es.onerror = (e) => {
      setConnected(false);
      console.log("[SSE] error", e);
      // optional: close to allow browser auto-reconnect cleanly
      // es.close();
    };

    return () => {
      setConnected(false);
      es.close();
      esRef.current = null;
    };
  }, [enabled, pushIncoming, setConnected]);
}

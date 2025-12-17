import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../store/notification.store";
import { presentNotification } from "../features/notifications/notification.present";
import { useNotificationSound } from "../hooks/useNotificationSound";

export default function FloatingNotification() {
  const nav = useNavigate();
  const latest = useNotificationStore((s) => s.latest);
  const clearLatest = useNotificationStore((s) => s.clearLatest);
  const markReadLocal = useNotificationStore((s) => s.markReadLocal);

  const { play } = useNotificationSound();

  const [open, setOpen] = useState(false);

  const presented = useMemo(() => {
    return latest ? presentNotification(latest) : null;
  }, [latest]);

  useEffect(() => {
    if (!latest) return;

    play();        // 🔊 صوت
    setOpen(true); // 🔔 toast

    const t = setTimeout(() => {
      setOpen(false);
      clearLatest();
    }, 3500);

    return () => clearTimeout(t);
  }, [latest, play, clearLatest]);

  if (!latest || !open || !presented) return null;

  const onClick = () => {
    // اختياري: اعتبره اتقري أول ما ضغط
    markReadLocal(latest.id);

    setOpen(false);
    clearLatest();
    nav(presented.href);
  };

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[360px] z-50 text-left"
    >
      <div className="rounded-2xl border bg-white shadow-lg p-3">
        <div className="text-sm text-gray-900">{presented.primaryText}</div>
        {presented.secondaryText ? (
          <div className="text-xs text-gray-500 mt-1">
            {presented.secondaryText}
          </div>
        ) : null}
      </div>
    </button>
  );
}

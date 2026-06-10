import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { presentNotification } from "@/features/notifications/notification.present";
import { useNotificationSound } from "@/features/notifications/hooks/useNotificationSound";

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

    play();
    setOpen(true);

    const t = setTimeout(() => {
      setOpen(false);
      clearLatest();
    }, 3500);

    return () => clearTimeout(t);
  }, [latest, play, clearLatest]);

  if (!latest || !open || !presented) return null;

  const onClick = () => {
    markReadLocal(latest.id);
    setOpen(false);
    clearLatest();
    nav(presented.href);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[360px] z-50 text-left"
    >
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-xl dark:shadow-black/40 p-4 flex items-start gap-3">
        <ToastBadge type={String(latest.type ?? "")} />

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
            {presented.primaryText}
          </div>
          {presented.secondaryText ? (
            <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 truncate">
              {presented.secondaryText}
            </div>
          ) : null}
        </div>

        {presented.rightThumb ? (
          <img
            src={presented.rightThumb}
            alt=""
            loading="lazy"
            className="h-10 w-10 rounded-xl object-cover bg-gray-100 dark:bg-zinc-800 shrink-0"
          />
        ) : null}
      </div>
    </motion.button>
  );
}

function ToastBadge({ type }: { type: string }) {
  const tone =
    type === "LIKE"
      ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
      : type === "COMMENT"
      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
      : type === "FOLLOW"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
      : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400";

  return (
    <span
      className={[
        "h-9 w-9 rounded-full grid place-items-center shrink-0",
        tone,
      ].join(" ")}
      aria-hidden="true"
    >
      {type === "LIKE" ? (
        <HeartIcon />
      ) : type === "COMMENT" ? (
        <CommentIcon />
      ) : type === "FOLLOW" ? (
        <UserPlusIcon />
      ) : (
        <BellIcon />
      )}
    </span>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21s-7.5-4.8-10-9.3C.4 8.4 2.4 4.5 6 4.5c2 0 3.4 1.1 4.2 2.3.4.6 1.2.6 1.6 0 .8-1.2 2.2-2.3 4.2-2.3 3.6 0 5.6 3.9 4 7.2C19.5 16.2 12 21 12 21Z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.6 1.3 4.9 3.4 6.5-.1 1-.6 2.3-1.8 3.4 1.9 0 3.6-.7 4.8-1.5 1.1.3 2.3.5 3.6.5 5.5 0 10-3.9 10-8.9S17.5 3 12 3Z" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-7 1.7-7 4v2h14v-2c0-2.3-3.7-4-7-4Zm11-5V6h-2v3h-3v2h3v3h2v-3h3V9h-3Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm8-5v-1l-2-2v-4.5C18 6 15.5 3.5 12 3.5S6 6 6 9.5V14l-2 2v1h16Z" />
    </svg>
  );
}

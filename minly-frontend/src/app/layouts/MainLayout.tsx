import React, { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/shared/store";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { useNotificationStream } from "@/features/notifications/hooks/useNotificationStream";
import { useNotificationSound } from "@/features/notifications/hooks/useNotificationSound";
import FloatingNotification from "@/features/notifications/components/FloatingNotification";
import { useMessagesStore } from "@/features/messages/store/messages.store";
import { MessagesAPI } from "@/features/messages/api/messages.api";

export default function MainLayout() {
  const user = useUserStore((s) => s.user);
  const unread = useNotificationStore((s) => s.unread);
  const latest = useNotificationStore((s) => s.latest);
  const dmUnread = useMessagesStore((s) => s.unread);
  const setDmUnread = useMessagesStore((s) => s.setUnread);

  const { pathname } = useLocation();
  const nav = useNavigate();

  useNotificationStream(!!user);
  const { play, unlock, unlocked } = useNotificationSound();

  useEffect(() => {
    if (!user) return;
    MessagesAPI.unreadCount()
      .then((res) => setDmUnread(res.data.data.count))
      .catch(() => {});
  }, [user, setDmUnread]);

  useEffect(() => {
    if (!latest) return;
    if (latest.isRead) return;
    if (pathname.startsWith("/notifications")) return;
    play();
  }, [latest, pathname, play]);

  const hideSidebar = pathname.startsWith("/notifications");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-[1240px] px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => nav("/")}
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Go to Home"
          >
            <div className="h-9 w-9 rounded-xl bg-blue-600 grid place-items-center text-white font-extrabold shadow-sm group-hover:shadow transition">
              M
            </div>
            <div className="font-semibold text-gray-900 tracking-tight">Minly</div>
          </button>

          <nav className="hidden md:flex items-center gap-1.5">
            <TopLink to="/" label="Home" end />
            <TopLink to="/explore" label="Explore" />
            <TopLink to="/search" label="Search" />
            <TopLink to="/upload" label="Create" />
            <TopLink to="/messages" label="Messages" />
            <TopLink to="/notifications" label="Notifications" />
            <TopLink to="/profile" label="Profile" />
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => nav("/search")}
              className="h-10 w-10 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-100 transition grid place-items-center text-gray-700 md:hidden"
              aria-label="Search"
            >
              <IconSearch />
            </button>

            <button
              onClick={() => nav("/messages")}
              className="relative h-10 w-10 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-100 transition grid place-items-center text-gray-700"
              aria-label="Messages"
            >
              <IconChat />
              {dmUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold grid place-items-center shadow">
                  {dmUnread > 99 ? "99+" : dmUnread}
                </span>
              )}
            </button>

            <button
              onClick={() => nav("/notifications")}
              className="relative h-10 w-10 rounded-full border border-transparent hover:border-gray-200 hover:bg-gray-100 transition grid place-items-center text-gray-700"
              aria-label="Notifications"
            >
              <IconBell />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold grid place-items-center shadow">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            <button
              onClick={() => nav("/profile")}
              className="ml-1 h-10 w-10 rounded-full bg-gray-100 border border-gray-200 grid place-items-center overflow-hidden hover:bg-gray-200/60 transition"
              aria-label="Profile"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {(user?.name?.[0] ?? "U").toUpperCase()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ✅ padding-bottom للموبايل عشان bottom nav ما يغطيش المحتوى */}
      <main className="mx-auto max-w-[1240px] px-4 py-6 pb-24 md:pb-6">
        <div
          className={
            hideSidebar
              ? "grid grid-cols-1"
              : "grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6"
          }
        >
          {!hideSidebar && (
            <aside className="hidden lg:block">
              <div className="sticky top-[76px]">
                <div className="rounded-2xl bg-white border border-gray-200/70 shadow-sm p-3">
                  <nav className="space-y-1">
                    <SideLink to="/" label="Home" icon={<IconHome />} end />
                    <SideLink to="/explore" label="Explore" icon={<IconCompass />} />
                    <SideLink to="/search" label="Search" icon={<IconSearch />} />
                    <SideLink to="/trending" label="Trending" icon={<IconTrending />} />
                    <SideLink to="/messages" label="Messages" icon={<IconChat />} />
                    <SideLink to="/saved" label="Saved" icon={<IconBookmark />} />
                  </nav>

                  <div className="mt-4 pt-4 border-t border-gray-200/70 text-[11px] text-gray-400 leading-relaxed">
                    (c) 2026 Minly Inc. <br />
                    Privacy | Terms | Ahmed Hany
                  </div>
                </div>
              </div>
            </aside>
          )}

          <section className="min-w-0">
            <Outlet />
            <FloatingNotification />
          </section>
        </div>
      </main>

      <MobileBottomNav unread={unread} />

      {!unlocked && (
        <div className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={unlock}
            className="px-4 py-3 rounded-2xl bg-gray-900 text-white shadow-lg text-sm font-semibold border border-white/10 hover:bg-black transition"
          >
            Enable notification sound
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Mobile Bottom Nav ---------------- */

function MobileBottomNav({ unread }: { unread: number }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-[1240px] px-4 h-16 flex items-center justify-between">
        <BottomLink to="/" ariaLabel="Home" end icon={<IconHome />} />
        <BottomLink to="/explore" ariaLabel="Explore" icon={<IconCompass />} />

        {/* Create في النص */}
        <NavLink to="/upload" aria-label="Create" className="h-12 w-12">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-sm">
            <IconPlus />
          </div>
        </NavLink>

        <BottomLink to="/trending" ariaLabel="Trending" icon={<IconTrending />} />
        <BottomLink
          to="/notifications"
          ariaLabel="Notifications"
          icon={<IconBell />}
          badge={unread}
        />
        <BottomLink to="/profile" ariaLabel="Profile" icon={<IconUser />} />
      </div>
    </nav>
  );
}

function BottomLink({
  to,
  icon,
  ariaLabel,
  end,
  badge,
}: {
  to: string;
  icon: React.ReactNode;
  ariaLabel: string;
  end?: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={ariaLabel}
      className={({ isActive }) =>
        [
          "relative h-10 w-10 rounded-xl grid place-items-center transition",
          isActive ? "text-blue-700" : "text-gray-600",
        ].join(" ")
      }
    >
      {icon}
      {badge && badge > 0 ? (
        <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold grid place-items-center shadow">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </NavLink>
  );
}

/* ---------------- Desktop Links ---------------- */

function TopLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "h-9 px-4 rounded-full text-sm font-semibold transition inline-flex items-center",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
          isActive
            ? "text-blue-700 bg-blue-50 shadow-sm ring-1 ring-blue-100"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

function SideLink({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "relative flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
          isActive
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          isActive
            ? "before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-blue-600"
            : "",
        ].join(" ")
      }
    >
      <span className="w-5 h-5 grid place-items-center text-gray-700">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

/* ---------------- Icons ---------------- */

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="11"
        cy="11"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 21l-4.35-4.35"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 17H6a3 3 0 01-3-3v-1c1.6-1 2-2.7 2-5a7 7 0 1114 0c0 2.3.4 4 2 5v1a3 3 0 01-3 3h-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 004 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCompass() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M14.5 9.5l-2 5-5 2 2-5 5-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrending() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 17l7-7 4 4 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 10V4h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3h12a1 1 0 011 1v18l-7-4-7 4V4a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 21a8 8 0 10-16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 11a4 4 0 100-8 4 4 0 000 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

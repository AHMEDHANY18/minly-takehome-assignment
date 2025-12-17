import React, { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user.store";
import { useNotificationStore } from "../store/notification.store";
import { useNotificationStream } from "../hooks/useNotificationStream";
import { useNotificationSound } from "../hooks/useNotificationSound";
import FloatingNotification from "../components/FloatingNotification";

export default function MainLayout() {
  const user = useUserStore((s) => s.user);
  const unread = useNotificationStore((s) => s.unread);
  const latest = useNotificationStore((s) => s.latest);

  const { pathname } = useLocation();
  const nav = useNavigate();

  // ✅ SSE مرة واحدة طول ما المستخدم داخل
  useNotificationStream(!!user);

  // ✅ الصوت
  const { play, unlock, unlocked } = useNotificationSound();

  // ✅ شغل الصوت لما يجي إشعار جديد (latest اتغير)
  useEffect(() => {
    if (!latest) return;
    if (latest.isRead) return;
    if (pathname.startsWith("/notifications")) return;

    play();
  }, [latest?.id, latest?.isRead, pathname, play]);

  const hideSidebar = pathname.startsWith("/notifications");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={() => nav("/")}
            className="flex items-center gap-2 shrink-0"
            aria-label="Go to Home"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 grid place-items-center text-white font-bold">
              M
            </div>
            <div className="font-semibold text-gray-900">Minly</div>
          </button>

          {/* Top nav */}
          <nav className="hidden md:flex items-center gap-1">
            <TopLink to="/" label="Home" end />
            <TopLink to="/explore" label="Explore" />
            <TopLink to="/upload" label="Create" />
            <TopLink to="/notifications" label="Notifications" />
            <TopLink to="/profile" label="Profile" />
          </nav>

          {/* Search */}
          <div className="flex-1">
            <div className="relative w-full md:max-w-[520px] md:mx-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch />
              </span>
              <input
                className="w-full h-10 pl-9 pr-3 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Search"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => nav("/notifications")}
              className="relative h-10 w-10 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition grid place-items-center text-gray-700"
              aria-label="Notifications"
            >
              <IconBell />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold grid place-items-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            <button
              onClick={() => nav("/profile")}
              className="ml-1 h-9 w-9 rounded-full bg-gray-100 border border-gray-200 grid place-items-center overflow-hidden"
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

      {/* Body */}
      <main className="mx-auto max-w-[1200px] px-4 py-6">
        <div
          className={
            hideSidebar
              ? "grid grid-cols-1"
              : "grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6"
          }
        >
          {!hideSidebar && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3">
                  <nav className="space-y-1">
                    <SideLink to="/" label="Home" icon={<IconHome />} end />
                    <SideLink to="/explore" label="Explore" icon={<IconCompass />} />
                    <SideLink to="/trending" label="Trending" icon={<IconTrending />} />
                    <SideLink to="/saved" label="Saved" icon={<IconBookmark />} />
                  </nav>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    © 2024 Minly Inc. <br />
                    Privacy · Terms · Cookies
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

      {/* ✅ زر تفعيل الصوت (لازم Click صريح) */}
      {!unlocked && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={unlock}
            className="px-4 py-3 rounded-xl bg-gray-900 text-white shadow-lg text-sm font-semibold"
          >
            Enable notification sound
          </button>
        </div>
      )}
    </div>
  );
}

function TopLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "h-9 px-3 rounded-full text-sm font-semibold transition inline-flex items-center",
          isActive
            ? "text-blue-700 bg-blue-50"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
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
          "flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition",
          isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        ].join(" ")
      }
    >
      <span className="w-5 h-5 grid place-items-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

/* ---------------- Icons ---------------- */

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
      <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" fill="none" stroke="currentColor" strokeWidth="2" />
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
      <path d="M3 17l7-7 4 4 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 10V4h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

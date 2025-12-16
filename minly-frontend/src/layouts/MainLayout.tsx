import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user.store";

export default function MainLayout() {
  const user = useUserStore((s) => s.user);
  const { pathname } = useLocation();
  const nav = useNavigate();

  // ✅ hide sidebar on notifications to match screenshot layout
  const hideSidebar = pathname.startsWith("/notifications");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-blue-600 grid place-items-center text-white font-bold">
              M
            </div>
            <div className="font-semibold text-gray-900">Minly</div>
          </div>

          {/* Top nav (like screenshot) */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <TopLink to="/" label="Home" end />
            <TopLink to="/explore" label="Explore" />
            <TopLink to="/upload" label="Create" />
            <TopLink to="/notifications" label="Notifications" />
            <TopLink to="/profile" label="Profile" />
          </nav>

          {/* Search */}
          <div className="flex-1 flex justify-end md:justify-center">
            <div className="relative w-full md:max-w-[520px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                className="w-full h-10 pl-9 pr-3 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Search"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <IconButton ariaLabel="Notifications" onClick={() => nav("/notifications")}>
              🔔
            </IconButton>

            <div className="ml-1 h-9 w-9 rounded-full bg-gray-100 border border-gray-200 grid place-items-center overflow-hidden">
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
            </div>
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
          {/* Left Sidebar (feed layout) */}
          {!hideSidebar && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-3">
                  <nav className="space-y-1">
                    <SideLink to="/" label="Home" icon="🏠" end />
                    <SideLink to="/explore" label="Explore" icon="🧭" />
                    <SideLink to="/trending" label="Trending" icon="📈" />
                    <SideLink to="/saved" label="Saved" icon="🔖" />
                  </nav>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    © 2024 Minly Inc. <br />
                    Privacy · Terms · Cookies
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Page Content */}
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </main>
    </div>
  );
}

function TopLink({
  to,
  label,
  end,
}: {
  to: string;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "h-9 px-3 rounded-full text-sm font-semibold transition inline-flex items-center",
          isActive ? "text-blue-700" : "text-gray-600 hover:text-gray-900",
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
  icon: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold transition",
          isActive
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        ].join(" ")
      }
    >
      <span className="w-5 text-center">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

function IconButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className="h-10 w-10 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition grid place-items-center text-gray-700"
    >
      {children}
    </button>
  );
}

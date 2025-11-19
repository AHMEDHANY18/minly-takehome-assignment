import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function MainLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const pageTitle =
    {
      "/": "Global Feed",
      "/upload": "Upload",
      "/profile": "Profile",
    }[pathname] || "Minly";

  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-bg-main flex justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-bg-main flex flex-col">

        {/* ⭐ Top Header */}
        <header className="sticky top-0 z-20 bg-bg-main/80 backdrop-blur-sm border-b border-borderc-section p-4 flex justify-between items-center">

          {/* Left side */}
          {isHome ? (
            <span className="material-symbols-outlined text-brand-purple text-2xl">
              all_inclusive
            </span>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="p-1 rounded-full hover:bg-black/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-text-primary">
                arrow_back
              </span>
            </button>
          )}

          {/* Title */}
          <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>

          {/* Right Empty (No Toggle) */}
          <span className="w-6" />
        </header>

        {/* ⭐ Main content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24">
          <Outlet />
        </main>

        {/* ⭐ Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

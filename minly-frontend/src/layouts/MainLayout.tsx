import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import ThemeToggle from "../components/ThemeToggle";

export default function MainLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const pageTitle = {
    "/": "Global Feed",
    "/upload": "Upload",
    "/profile": "Profile",
  }[pathname] || "Minly";

  return (
    <div className="min-h-screen bg-bg-main flex justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-bg-main flex flex-col">

        {/* ⭐ Top Header */}
        <header className="sticky top-0 z-20 bg-bg-main/80 backdrop-blur-sm border-b border-borderc-section p-4 flex justify-between items-center">

          {/* Left Icon (Back for upload/profile) */}
          {pathname !== "/" ? (
            <button onClick={() => navigate("/")} className="p-1 rounded-full hover:bg-black/10 active:scale-95">
              <span className="material-symbols-outlined text-text-primary">arrow_back</span>
            </button>
          ) : (
            <span className="material-symbols-outlined text-brand-purple text-2xl">all_inclusive</span>
          )}

          {/* Title */}
          <h1 className="text-lg font-semibold text-text-primary">{pageTitle}</h1>

          {/* Right Icon (Theme toggle) */}
          <ThemeToggle />
        </header>

        {/* ⭐ Main content area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24">
          <Outlet />
        </main>

        {/* ⭐ Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}

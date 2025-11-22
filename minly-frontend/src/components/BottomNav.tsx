import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    pathname === path ? "text-[#ad2bee]" : "text-[#7c6189]";

  return (
    <nav className="fixed bottom-0 z-10 w-full max-w-md border-t border-zinc-200 bg-[#f7f6f8]/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around px-4">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad2bee] ${isActive("/")}`}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className={`material-symbols-outlined ${pathname === "/" ? "filled" : ""}`}>home</span>
          <span className="text-xs font-medium">Home</span>
        </button>

        <button
          onClick={() => navigate("/upload")}
          className={`flex flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad2bee] ${isActive("/upload")}`}
          aria-current={pathname === "/upload" ? "page" : undefined}
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-xs font-medium">Upload</span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad2bee] ${isActive("/profile")}`}
          aria-current={pathname === "/profile" ? "page" : undefined}
        >
          <span className={`material-symbols-outlined ${pathname === "/profile" ? "filled" : ""}`}>
            person
          </span>
          <span className="text-xs font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
}

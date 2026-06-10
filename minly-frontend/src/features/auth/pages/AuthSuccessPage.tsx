import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "@/features/auth/api/auth.api";

export default function AuthSuccessPage() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await AuthAPI.me();
        nav("/", { replace: true });
      } catch {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 grid place-items-center p-6">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-500 animate-spin" />
        <div className="text-sm font-semibold text-gray-600 dark:text-zinc-400">
          Signing you in…
        </div>
      </div>
    </div>
  );
}

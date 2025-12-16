import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AuthAPI } from "../../api/auth";
import { useUserStore } from "../../store/user.store";

export default function AuthBootstrap() {
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const user = useUserStore((s) => s.user);

  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const res = await AuthAPI.me();
        // حسب شكل استجابتك: عدّل السطر ده لو response مختلف
        const meUser = (res.data as any)?.user ?? (res.data as any)?.data?.user;
        if (meUser) setUser(meUser);
        else clearUser();
      } catch {
        clearUser();
      } finally {
        setStatus("ready");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") return <div style={{ padding: 16 }}>Loading...</div>;

  // لو مش logged in -> يروح /login ويحفظ المكان اللي كان فيه
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

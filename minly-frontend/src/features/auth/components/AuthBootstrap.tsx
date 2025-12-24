import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthAPI } from "@/features/auth/api/auth.api";
import { useUserStore } from "@/shared/store/user.store";
import { useAuthStore } from "@/shared/store/auth.store";

export default function AuthBootstrap() {
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  const { status, setAuthenticated, setUnauthenticated } = useAuthStore();

  useEffect(() => {
    AuthAPI.me()
      .then((res) => {
        setUser(res.data.user);
        setAuthenticated();
      })
      .catch(() => {
        clearUser();
        setUnauthenticated();
      });
  }, [setUser, clearUser, setAuthenticated, setUnauthenticated]);

  if (status === "loading") {
    return <FullPageLoader />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Loading...
    </div>
  );
}

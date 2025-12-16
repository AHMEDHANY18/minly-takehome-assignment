import { Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthAPI } from "../../api/auth";
import { useUserStore } from "../../store/user.store";
import { useAuthStore } from "../../store/auth.store";

export default function AuthBootstrap() {
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  const {
    status,
    setAuthenticated,
    setUnauthenticated,
  } = useAuthStore();

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
  }, []);

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
      Loading…
    </div>
  );
}

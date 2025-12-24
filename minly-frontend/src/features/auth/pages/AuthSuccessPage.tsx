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

  return <div style={{ padding: 24 }}>Signing you in...</div>;
}

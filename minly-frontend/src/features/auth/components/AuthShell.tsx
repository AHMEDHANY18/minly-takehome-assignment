import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../../api/auth";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await AuthAPI.me();
        setReady(true);
      } catch {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  if (!ready) return <div style={{ padding: 16 }}>Loading...</div>;
  return <>{children}</>;
}

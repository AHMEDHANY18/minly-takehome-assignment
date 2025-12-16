import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../../api/auth";

export default function AuthSuccessPage() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await AuthAPI.me(); // يثبت إن الكوكيز شغالة
        nav("/", { replace: true });
      } catch {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  return <div style={{ padding: 24 }}>Signing you in…</div>;
}

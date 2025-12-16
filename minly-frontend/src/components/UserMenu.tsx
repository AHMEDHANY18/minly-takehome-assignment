import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/user.store";
import { AuthAPI } from "../api/auth";

export default function UserMenu() {
  const user = useUserStore((s) => s.user);
  const clearUser = useUserStore((s) => s.clearUser);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initial = user.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: "#222",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 44,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
            minWidth: 160,
            zIndex: 100,
          }}
        >
          <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{user.email}</div>
          </div>

          <button
            onClick={async () => {
              await AuthAPI.startLogout();
              clearUser();
              nav("/login", { replace: true });
            }}
            style={{
              width: "100%",
              padding: 12,
              border: "none",
              background: "transparent",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

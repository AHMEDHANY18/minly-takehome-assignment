import { AuthAPI } from "../../api/auth";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background, #fafafa)",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 32,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Welcome to Minly</h1>
        <p style={{ marginBottom: 24, color: "#666" }}>
          Sign in to continue
        </p>

        <button
          onClick={() => AuthAPI.startLogin()}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}

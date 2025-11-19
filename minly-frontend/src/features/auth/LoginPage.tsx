import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth";
import { useUserStore } from "../../store/user.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await AuthAPI.login({ email, password });

      const body: any = res.data;

      // نحاول ندعم شكلين للريسبونس:
      const token = body.token ?? body.data?.token;
      const user = body.user ?? body.data?.user;

      if (!token || !user) {
        throw new Error("Unexpected login response shape");
      }

      localStorage.setItem("token", token);
      setUser(user);

      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1 text-center">
          Minly Login
        </h1>
        <p className="text-sm text-slate-300 mb-6 text-center">
          Sign in to your account
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-700 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed px-3 py-2 font-semibold text-slate-900 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

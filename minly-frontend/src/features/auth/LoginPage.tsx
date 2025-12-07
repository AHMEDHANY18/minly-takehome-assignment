import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth";
import { useUserStore } from "../../store/user.store";

export default function LoginPage() {
  const navigate = useNavigate(); 
  const setUser = useUserStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) شيك الأول هل الإيميل موجود ولا لأ 👇
      const checkRes = await AuthAPI.checkEmail(email);
      const payload = checkRes.data as Partial<{
        exists: boolean;
        result: boolean;
        data: { exists?: boolean };
      }>;
      const exists =
        payload.exists ?? payload.result ?? payload.data?.exists ?? false;

      if (!exists) {
        // لو الإيميل مش موجود → روح على صفحة التسجيل ومعاك الإيميل
        navigate("/register", { state: { email } });
        return;
      }

      // 2) لو الإيميل موجود فعلاً → كمّل login عادي 👇
      const res = await AuthAPI.login({ email, password });
      const body = res.data;

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
      setError(
        err?.response?.data?.message ||
          "Incorrect email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5ff] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-[0_16px_40px_rgba(15,23,42,0.1)] px-6 py-8 sm:px-8 sm:py-10">
        {/* Title */}
        <h1 className="text-center text-2xl font-semibold text-slate-900 mb-8">
          Minly
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-[#b845ff] focus:ring-2 focus:ring-[#e3c7ff]"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-[#b845ff] focus:ring-2 focus:ring-[#e3c7ff]"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.584 10.587A3 3 0 0 0 12 15a3 3 0 0 0 2.828-1.993M9.88 5.515A8.46 8.46 0 0 1 12 5c5 0 9 4 10 7-0.352.935-1.005 2.047-1.974 3.09" />
                      <path d="M6.228 6.228C4.243 7.34 2.95 9.061 2 12c.4 1.184 1.09 2.39 2.045 3.45A11.73 11.73 0 0 0 7 17.8" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7S1 12 1 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-1.5 text-[11px] text-[#e5533d]">
                {error}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#b845ff] hover:bg-[#a028ff] active:bg-[#8a1ce5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(116,48,255,0.45)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Footer link */}
        <p className="mt-5 text-center text-[11px] text-slate-500">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="font-semibold text-[#b845ff] hover:underline"
            onClick={() => navigate("/register", { state: { email } })}
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}

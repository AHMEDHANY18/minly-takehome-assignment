import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth";
import { useUserStore } from "../../store/user.store";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useUserStore((s) => s.setUser);

  // لو جاي من صفحة اللوجين وفيها ايميل
  const initialEmail = (location.state as any)?.email ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await AuthAPI.register({
        name,
        email,
        password,
      });

      const body: any = res.data;

      // نحاول ندعم اكتر من شكل للـ response
      const token = body.token ?? body.data?.token;
      const user = body.user ?? body.data?.user;

      // لو الـ backend بيرجع بس user بدون token:
      // ممكن نعمل بعد التسجيل مباشرة login بنفس البيانات
      if (!token || !user) {
        // fallback: جرّب تعمل login مباشرة
        const loginRes = await AuthAPI.login({ email, password });
        const loginBody: any = loginRes.data;
        const loginToken = loginBody.token ?? loginBody.data?.token;
        const loginUser = loginBody.user ?? loginBody.data?.user;

        if (!loginToken || !loginUser) {
          throw new Error("Unexpected register/login response shape");
        }

        localStorage.setItem("token", loginToken);
        setUser(loginUser);
        navigate("/");
        return;
      }

      localStorage.setItem("token", token);
      setUser(user);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Failed to sign up. Please try again."
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-[#b845ff] focus:ring-2 focus:ring-[#e3c7ff]"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Email Address
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
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-700"
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
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-[#b845ff] focus:ring-2 focus:ring-[#e3c7ff]"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute inset-y-0 right-2 flex items-center px-2 text-slate-400 hover:text-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {showConfirm ? (
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
          </div>

          {/* Error message */}
          {error && (
            <p className="text-[11px] text-[#e5533d]">
              {error}
            </p>
          )}

          {/* Sign up button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-[#ff3df5] to-[#2459ff] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(116,48,255,0.45)] transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-[#2459ff] hover:underline"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

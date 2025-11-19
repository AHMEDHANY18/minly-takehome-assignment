import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AuthAPI } from "../../api/auth";

export default function EmailCheckPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await AuthAPI.checkEmail(email); // هنضيفها كمان دلوقتي
      const exists = res.data.exists;

      if (exists) {
        navigate("/login", { state: { email } });
      } else {
        navigate("/register", { state: { email } });
      }
    } catch (err: any) {
      setError("Error checking email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-3">
      <div className="bg-slate-800/70 p-6 rounded-xl w-full max-w-sm border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">
          Minly
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full rounded-lg px-3 py-2 bg-slate-900 border border-slate-600 text-white focus:border-emerald-400 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 py-2 rounded-lg text-slate-900 font-semibold"
          >
            {loading ? "Checking..." : "Next"}
          </button>
        </form>
      </div>
    </div>
  );
}

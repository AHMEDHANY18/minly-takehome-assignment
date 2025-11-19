import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/user.store";

export default function FeedPage() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // أو Loader بسيط
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Welcome {user.name} – Feed coming soon 🔥
      </h1>
    </div>
  );
}

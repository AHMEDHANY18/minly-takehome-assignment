// src/features/profile/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MediaItem } from "../../api/media";
import { UserAPI, type MeData } from "../../api/user";

// helper لتنسيق الأرقام: 1200 => 1.2k
function formatCount(n: number) {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState<MeData | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 👈 هنا بنستخدم بس /user/me
        const res = await UserAPI.getMe();
        const body = res.data;
        const data = (body as any).data as MeData;

        setMe(data);
        setItems(data.media ?? []);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "Failed to load profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const joinedYear = me ? new Date(me.createdAt).getFullYear() : null;
  const avatarUrl =
    me?.avatarUrl ||
    (me
      ? `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(
          me.name
        )}`
      : "");

  const uploadsCount = me?.mediaCount ?? items.length;
  const likesReceived = me?.totalLikesReceived ?? 0;
  const likesGiven = me?.totalLikesGiven ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f6f8] flex justify-center">
      <div className="relative mx-auto flex h-auto min-h-screen w-full max-w-md flex-col bg-[#f7f6f8]">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-[#f7f6f8]/90 backdrop-blur-sm border-b border-zinc-200/60">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="p-1 -ml-1 rounded-full hover:bg-black/5 active:scale-95 transition"
              aria-label="Back to feed"
            >
              <span className="material-symbols-outlined text-[22px]">
                arrow_back
              </span>
            </button>

            <h1 className="text-[15px] font-semibold text-[#161118]">
              Profile
            </h1>

            <span className="w-6" />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-4 pb-24">
          {loading && (
            <p className="mt-6 text-center text-sm text-[#7c6189]">
              Loading profile…
            </p>
          )}

          {error && (
            <p className="mt-6 text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && me && (
            <section className="mt-4 rounded-3xl bg-white shadow-[0_18px_35px_rgba(15,23,42,0.08)] pb-4">
              {/* Header + avatar */}
              <div className="flex flex-col items-center pt-6 px-5">
                <div className="h-24 w-24 rounded-full bg-[#f3eefc] flex items-center justify-center overflow-hidden shadow-[0_10px_25px_rgba(15,23,42,0.15)]">
                  <img
                    src={avatarUrl}
                    alt={me.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-base font-semibold text-[#161118]">
                    {me.name}
                  </p>
                  <p className="text-xs text-[#7c6189] mt-0.5">
                    {me.email}
                  </p>
                  {joinedYear && (
                    <p className="text-xs text-[#a293bf] mt-0.5">
                      Joined in {joinedYear}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats cards */}
              <div className="mt-5 grid grid-cols-3 gap-2 px-4">
                <div className="rounded-2xl bg-[#f8f6ff] px-3 py-2.5 text-center">
                  <p className="text-[11px] text-[#8a7aa7]">Uploads</p>
                  <p className="mt-1 text-base font-semibold text-[#161118]">
                    {uploadsCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f6ff] px-3 py-2.5 text-center">
                  <p className="text-[11px] text-[#8a7aa7]">Likes received</p>
                  <p className="mt-1 text-base font-semibold text-[#161118]">
                    {formatCount(likesReceived)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f6ff] px-3 py-2.5 text-center">
                  <p className="text-[11px] text-[#8a7aa7]">Likes given</p>
                  <p className="mt-1 text-base font-semibold text-[#161118]">
                    {formatCount(likesGiven)}
                  </p>
                </div>
              </div>

              {/* Gallery title */}
              <div className="mt-5 px-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#161118]">
                  Your uploads
                </p>
                <p className="text-[11px] text-[#a293bf]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>

              {/* Gallery grid */}
              {items.length === 0 ? (
                <p className="mt-3 px-4 pb-4 text-xs text-[#8a7aa7]">
                  You haven&apos;t uploaded any media yet.
                </p>
              ) : (
                <div className="mt-3 px-4 pb-4 grid grid-cols-2 gap-2">
                  {items.map((m) => {
                    const isVideo =
                      m.type === "VIDEO" || m.type === "video";

                    return (
                      <div
                        key={m.id}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-[#e5e1f5]"
                      >
                        <img
                          src={m.thumbnailUrl || m.url}
                          alt={m.title || "Media"}
                          className="h-full w-full object-cover"
                        />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm">
                              <span className="material-symbols-outlined text-[18px]">
                                play_arrow
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 z-10 w-full max-w-md border-t border-zinc-200 bg-[#f7f6f8]/90 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-around px-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex flex-col items-center gap-0.5 text-[#7c6189] hover:text-[#ad2bee]"
            >
              <span className="material-symbols-outlined text-[22px]">
                home
              </span>
              <span className="text-[11px] font-medium">Home</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/upload")}
              className="flex flex-col items-center gap-0.5 text-[#7c6189] hover:text-[#ad2bee]"
            >
              <span className="material-symbols-outlined text-[22px]">
                add_circle
              </span>
              <span className="text-[11px] font-medium">Upload</span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-0.5 text-[#ad2bee]"
            >
              <span className="material-symbols-outlined filled text-[22px]">
                person
              </span>
              <span className="text-[11px] font-semibold">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

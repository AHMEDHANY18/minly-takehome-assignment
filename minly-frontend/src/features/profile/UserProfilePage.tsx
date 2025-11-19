// src/features/profile/UserProfilePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { MediaItem } from "../../api/media";
import { UserAPI, type MeData } from "../../api/user";
import BottomNav from "../../components/BottomNav";

function formatCount(n: number) {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const [user, setUser] = useState<MeData | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await UserAPI.getById(userId!);
        const data = res.data.data;
        setUser(data);
        setItems(data.media ?? []);
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message || "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const joinedYear = user ? new Date(user.createdAt).getFullYear() : null;

  const avatarUrl =
    user?.avatarUrl ||
    (user
      ? `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${encodeURIComponent(
          user.name
        )}`
      : "");

  const uploadsCount = user?.mediaCount ?? items.length;
  const likesReceived = user?.totalLikesReceived ?? 0;
  const likesGiven = user?.totalLikesGiven ?? 0;

  return (
    <div className="min-h-screen bg-[#f7f6f8] flex justify-center">
      <div className="relative mx-auto flex h-auto min-h-screen w-full max-w-md flex-col bg-[#f7f6f8]">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-[#f7f6f8]/90 backdrop-blur-sm border-b border-zinc-200/60">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 rounded-full hover:bg-black/5 active:scale-95 transition"
              aria-label="Back"
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

        <main className="flex-1 overflow-y-auto px-4 pb-24">
          {loading && (
            <p className="mt-6 text-center text-sm text-[#7c6189]">
              Loading profile…
            </p>
          )}

          {error && (
            <p className="mt-6 text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && user && (
            <section className="mt-4 rounded-3xl bg-white shadow-[0_18px_35px_rgba(15,23,42,0.08)] pb-4">
              {/* Header + avatar */}
              <div className="flex flex-col items-center pt-6 px-5">
                <div className="h-24 w-24 rounded-full bg-[#f3eefc] flex items-center justify-center overflow-hidden shadow-[0_10px_25px_rgba(15,23,42,0.15)]">
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-base font-semibold text-[#161118]">
                    {user.name}
                  </p>
                  <p className="text-xs text-[#7c6189] mt-0.5">
                    {user.email}
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
                  Uploads
                </p>
                <p className="text-[11px] text-[#a293bf]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>

              {/* Gallery grid */}
              {items.length === 0 ? (
                <p className="mt-3 px-4 pb-4 text-xs text-[#8a7aa7]">
                  This user hasn&apos;t uploaded any media yet.
                </p>
              ) : (
                <div className="mt-3 px-4 pb-4 grid grid-cols-2 gap-2">
                  {items.map((m) => {
                    const isVideo =
                      m.type === "VIDEO" || m.type === "video";

                    return (
                      <div
                        key={m.id}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-[#e5e1f5]"
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

                        <div className="pointer-events-none absolute inset-0 flex items-end justify-start bg-black/0 opacity-0 transition duration-150 group-hover:bg-black/40 group-hover:opacity-100">
                          <div className="m-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">
                            <span className="material-symbols-outlined text-[14px]">
                              favorite
                            </span>
                            <span>{formatCount(m.likesCount)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}

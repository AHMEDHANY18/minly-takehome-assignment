// src/features/profile/UserProfilePage.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { MediaItem } from "../../api/media";
import { UserAPI, type MeData } from "../../api/user";

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

  // ✅ NEW: selected media to open in modal
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const closeModal = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await UserAPI.getById(userId!);
        const data = res.data.data;

        if (!active) return;
        setUser(data);
        setItems(data.media ?? []);
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(err?.response?.data?.message || "Failed to load profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
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
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-[#7c6189] hover:underline"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back
      </button>

      {loading && (
        <p className="text-center text-sm text-[#7c6189]">
          Loading profile...
        </p>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      {!loading && !error && user && (
        <section className="rounded-3xl bg-white shadow-[0_18px_35px_rgba(15,23,42,0.08)] pb-4">
          {/* Header */}
          <div className="flex flex-col items-center pt-6 px-5">
            <div className="h-24 w-24 rounded-full bg-[#f3eefc] flex items-center justify-center overflow-hidden shadow-[0_10px_25px_rgba(15,23,42,0.15)]">
              <img
                src={avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            <div className="mt-4 text-center">
              <p className="text-base font-semibold text-[#161118]">
                {user.name}
              </p>
              <p className="text-xs text-[#7c6189] mt-0.5">{user.email}</p>
              {joinedYear && (
                <p className="text-xs text-[#a293bf] mt-0.5">
                  Joined in {joinedYear}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
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

          {/* Uploads header */}
          <div className="mt-5 px-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#161118]">Uploads</p>
            <p className="text-[11px] text-[#a293bf]">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Uploads grid */}
          {items.length === 0 ? (
            <p className="mt-3 px-4 pb-4 text-xs text-[#8a7aa7]">
              This user hasn&apos;t uploaded any media yet.
            </p>
          ) : (
            <>
              <div className="mt-3 px-4 pb-4 grid grid-cols-2 gap-2">
                {items.map((m) => {
                  const isVideo = m.type === "VIDEO" || m.type === "video";

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelected(m)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-[#e5e1f5] text-left"
                    >
                      <img
                        src={m.thumbnailUrl || m.url}
                        alt={m.title || "Media"}
                        className="h-full w-full object-cover"
                        loading="lazy"
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
                    </button>
                  );
                })}
              </div>

              {/* ✅ Modal Viewer for Image/Video */}
              {selected && (
                <div
                  className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={closeModal}
                >
                  <div
                    className="relative w-full max-w-3xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={closeModal}
                      className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-black shadow flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>

                    {(selected.type === "VIDEO" ||
                      selected.type === "video") ? (
                      <video
                        src={selected.url}
                        controls
                        autoPlay
                        poster={selected.thumbnailUrl || undefined}
                        className="w-full max-h-[80vh] rounded-2xl bg-black"
                      />
                    ) : (
                      <img
                        src={selected.url}
                        alt={selected.title || "Media"}
                        className="w-full max-h-[80vh] object-contain rounded-2xl bg-black"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

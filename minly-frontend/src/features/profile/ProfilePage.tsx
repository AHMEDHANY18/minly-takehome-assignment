import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileAPI, type ProfileMediaItem, type ProfileResponse } from "../../api/profile";

type Tab = "ALL" | "VIDEOS" | "PHOTOS"

export default function ProfilePage() {
  const nav = useNavigate();

  const [tab, setTab] = useState<Tab>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ProfileResponse["data"] | null>(null);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError(null);

    ProfileAPI.me()
      .then((res) => {
        if (!alive) return;
        setPayload(res.data.data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.message ?? "Failed to load profile");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const user = payload?.user;

  const username = useMemo(() => {
    const email = user?.email ?? "";
    const local = email.split("@")[0] || "user";
    return `@${local}`;
  }, [user?.email]);

  const filtered = useMemo(() => {
    const list = payload?.media ?? [];
    if (tab === "ALL") return list;
    if (tab === "VIDEOS") return list.filter((m) => normalizeMediaType(m.type, m.url) === "VIDEO");
    if (tab === "PHOTOS") return list.filter((m) => normalizeMediaType(m.type, m.url) === "IMAGE");
    return [];
  }, [payload?.media, tab]);

  return (
    <div className="min-h-screen bg-[#F4F7FF]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-[#E7ECFF] bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center gap-4">
          {/* logo */}
          <button
            onClick={() => nav("/")}
            className="flex items-center gap-2 shrink-0"
            aria-label="Go to home"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 grid place-items-center text-white font-bold">
              M
            </div>
            <div className="font-semibold text-gray-900">Minly</div>
          </button>

          <div className="flex-1" />

          {/* Home button */}
          <button
            onClick={() => nav("/")}
            className="h-9 px-3 rounded-xl bg-white border border-[#E7ECFF] shadow-sm text-sm font-semibold text-gray-700 hover:bg-[#F6F8FF] transition flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gray-600"
              aria-hidden="true"
            >
              <path
                d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="grid grid-cols-[280px_1fr] gap-6">
          {/* Left */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-[#E7ECFF] shadow-[0_10px_30px_rgba(16,24,40,0.06)] p-5">
              <div className="flex flex-col items-center text-center">
                <ProfileAvatar name={user?.name ?? "User"} src={user?.avatarUrl ?? null} />

                <div className="mt-3 text-[18px] font-semibold text-gray-900">
                  {loading ? "Loading…" : user?.name ?? "—"}
                </div>

                <div className="mt-0.5 text-[12px] text-gray-500">{username}</div>

                <div className="mt-2 text-[12px] text-gray-500 flex items-center gap-2">
                  <span className="text-gray-400">✉</span>
                  <span className="truncate max-w-[220px]">{user?.email ?? "—"}</span>
                </div>

                <div className="mt-2 text-[12px] text-gray-500 flex items-center gap-2">
                  <span className="text-gray-400">📅</span>
                  <span>Joined {user?.createdAt ? formatMonthYear(user.createdAt) : "—"}</span>
                </div>

                <button
                  onClick={() => nav("/profile/edit")}
                  className="mt-4 h-10 w-full rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Edit Profile
                </button>

                <div className="mt-4 w-full grid grid-cols-2 gap-3">
                  <MiniStat label="Followers" value={user?.followerCount ?? 0} />
                  <MiniStat label="Following" value={user?.followingCount ?? 0} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#E7ECFF] shadow-[0_10px_30px_rgba(16,24,40,0.06)] p-4 space-y-3">
              <StatRow icon="⬆" label="UPLOADS" value={user?.mediaCount ?? 0} />
              <StatRow icon="❤" label="LIKES GET" value={compactNumber(user?.totalLikesReceived ?? 0)} />
              <StatRow icon="👍" label="LIKES GIVEN" value={user?.totalLikesGiven ?? 0} />
            </div>
          </aside>

          {/* Right */}
          <main>
            <div className="flex items-center gap-6 px-2">
              <TopTab active={tab === "ALL"} onClick={() => setTab("ALL")}>All Media</TopTab>
              <TopTab active={tab === "VIDEOS"} onClick={() => setTab("VIDEOS")}>Videos</TopTab>
              <TopTab active={tab === "PHOTOS"} onClick={() => setTab("PHOTOS")}>Photos</TopTab>
              <LinkTab onClick={() => nav("/saved")}>Saved</LinkTab>
              </div>

            <div className="mt-5">
              {error && (
                <div className="mb-4 rounded-2xl bg-white border border-red-100 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {loading ? (
                <GridSkeleton />
              ) : (
                <div className="grid grid-cols-3 gap-5">
                  {filtered.map((m) => (
                    <MediaTile key={m.id} media={m} onClick={() => nav(`/media/${m.id}`)} />
                  ))}

                  <button
                    onClick={() => nav("/upload")}
                    className="aspect-square rounded-2xl border-2 border-dashed border-[#D8E2FF] bg-white/60 grid place-items-center text-gray-400 hover:bg-white transition"
                  >
                    <div className="text-center">
                      <div className="text-xl">＋</div>
                      <div className="mt-1 text-[12px] font-semibold">Addmore</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI bits ---------------- */

function ProfileAvatar({ name, src }: { name: string; src: string | null }) {
  if (src) return <img src={src} alt={name} className="h-[96px] w-[96px] rounded-full object-cover" />;
  const initial = (name?.[0] ?? "U").toUpperCase();
  return (
    <div className="relative">
      <div className="h-[96px] w-[96px] rounded-full bg-[#F7C9B5] grid place-items-center text-white text-3xl font-bold">
        {initial}
      </div>
      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white" />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#F6F8FF] border border-[#E7ECFF] p-3">
      <div className="text-[11px] font-semibold text-gray-500">{label}</div>
      <div className="mt-1 text-[14px] font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E7ECFF] bg-white p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-[#F3F6FF] border border-[#E7ECFF] grid place-items-center text-gray-600">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-semibold text-gray-400">{label}</div>
        <div className="text-[16px] font-semibold text-gray-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function TopTab({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative text-sm font-semibold",
        active ? "text-blue-700" : "text-gray-500 hover:text-gray-800",
      ].join(" ")}
    >
      {children}
      <span
        className={[
          "absolute left-0 -bottom-3 h-[2px] rounded-full transition",
          active ? "w-full bg-blue-600" : "w-0 bg-transparent",
        ].join(" ")}
      />
    </button>
  );
}

function MediaTile({ media, onClick }: { media: ProfileMediaItem; onClick: () => void }) {
  const type = normalizeMediaType(media.type, media.url);
  const isVideo = type === "VIDEO";

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-[#E7ECFF] shadow-[0_10px_30px_rgba(16,24,40,0.06)]"
      aria-label="Open media"
    >
      <MediaThumb media={media} />

      {isVideo && (
        <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/85 border border-[#E7ECFF] grid place-items-center text-gray-700 text-[12px]">
          ▶
        </div>
      )}
    </button>
  );
}

/* ---------------- Thumb ---------------- */

function guessMediaTypeFromUrl(url?: string): "IMAGE" | "VIDEO" | undefined {
  if (!url) return undefined;
  const clean = url.split("?")[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v)$/i.test(clean)) return "VIDEO";
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(clean)) return "IMAGE";
  return undefined;
}
function LinkTab({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative text-sm font-semibold text-gray-500 hover:text-gray-800"
    >
      {children}
      <span className="absolute left-0 -bottom-3 h-[2px] w-0 bg-transparent" />
    </button>
  );
}

function normalizeMediaType(t?: string, url?: string): "IMAGE" | "VIDEO" {
  const up = (t ?? "").toUpperCase();
  if (up === "IMAGE" || up === "VIDEO") return up;
  return guessMediaTypeFromUrl(url) ?? "IMAGE";
}

function MediaThumb({ media }: { media: { url: string; type?: string; thumbnailUrl?: string | null } }) {
  const [broken, setBroken] = useState(false);

  const type = normalizeMediaType(media.type, media.url);
  const isVideo = type === "VIDEO";

  if (isVideo && !media.thumbnailUrl) return <VideoFirstFrame url={media.url} />;

  const src = media.thumbnailUrl ?? media.url;
  if (!src || broken) return <div className="h-full w-full bg-[#F3F6FF]" />;

  return (
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

function VideoFirstFrame({ url }: { url: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);

  return (
    <div className="relative h-full w-full">
      {!ready && <div className="absolute inset-0 bg-[#F3F6FF]" />}

      <video
        ref={ref}
        src={url}
        preload="metadata"
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        onLoadedMetadata={() => {
          const v = ref.current;
          if (!v) return;
          try {
            v.currentTime = 0.01;
          } catch {}
        }}
        onSeeked={() => {
          ref.current?.pause();
          setReady(true);
        }}
        onLoadedData={() => setReady(true)}
      />
    </div>
  );
}

/* ---------------- Utils ---------------- */

function compactNumber(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  const rounded = Math.round(k * 10) / 10;
  return `${rounded}k`;
}

function formatMonthYear(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-white border border-[#E7ECFF] overflow-hidden">
          <div className="h-full w-full bg-[#F3F6FF]" />
        </div>
      ))}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileAPI, type ProfileMediaItem, type ProfileResponse } from "../../api/profile";
import { MediaAPI } from "../../api/media";

type Tab = "ALL" | "VIDEOS" | "PHOTOS";

export default function ProfilePage() {
  const nav = useNavigate();

  const [tab, setTab] = useState<Tab>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ProfileResponse["data"] | null>(null);

  // single modals (instead of per-card)
  const [editing, setEditing] = useState<ProfileMediaItem | null>(null);
  const [deleting, setDeleting] = useState<ProfileMediaItem | null>(null);

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

    if (tab === "VIDEOS") {
      return list.filter((m) => normalizeMediaType(m.type, m.url) === "VIDEO");
    }

    if (tab === "PHOTOS") {
      return list.filter((m) => normalizeMediaType(m.type, m.url) === "IMAGE");
    }

    return [];
  }, [payload?.media, tab]);

  const onMediaUpdated = (id: string, patch: Partial<ProfileMediaItem>) => {
    setPayload((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        media: (prev.media ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
      };
    });
  };

  const onMediaDeleted = (id: string) => {
    setPayload((prev) => {
      if (!prev) return prev;

      const nextMedia = (prev.media ?? []).filter((m) => m.id !== id);

      return {
        ...prev,
        user: {
          ...prev.user,
          mediaCount: Math.max(0, (prev.user.mediaCount ?? 0) - 1),
        },
        media: nextMedia,
        pagination: {
          ...prev.pagination,
          total: Math.max(0, (prev.pagination.total ?? 0) - 1),
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F7FF]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-[#E7ECFF] bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-4 h-14 flex items-center gap-4">
          <button onClick={() => nav("/")} className="flex items-center gap-2 shrink-0" aria-label="Go to home">
            <div className="h-8 w-8 rounded-lg bg-blue-600 grid place-items-center text-white font-bold">M</div>
            <div className="font-semibold text-gray-900">Minly</div>
          </button>

          <div className="flex-1" />

          <button
            onClick={() => nav("/")}
            className="h-9 px-3 rounded-xl bg-white border border-[#E7ECFF] shadow-sm text-sm font-semibold text-gray-700 hover:bg-[#F6F8FF] transition flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600" aria-hidden="true">
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
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
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
              <TopTab active={tab === "ALL"} onClick={() => setTab("ALL")}>
                All Media
              </TopTab>
              <TopTab active={tab === "VIDEOS"} onClick={() => setTab("VIDEOS")}>
                Videos
              </TopTab>
              <TopTab active={tab === "PHOTOS"} onClick={() => setTab("PHOTOS")}>
                Photos
              </TopTab>
              <LinkTab onClick={() => nav("/saved")}>Saved</LinkTab>
            </div>

            <div className="mt-5">
              {error && (
                <div className="mb-4 rounded-2xl bg-white border border-red-100 p-4 text-sm text-red-600">{error}</div>
              )}

              {loading ? (
                <GridSkeleton />
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white border border-[#E7ECFF] p-8 text-center">
                  <div className="text-[16px] font-semibold text-gray-900">No media yet</div>
                  <div className="mt-1 text-sm text-gray-500">Upload your first post to see it here.</div>
                  <button
                    onClick={() => nav("/upload")}
                    className="mt-4 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Upload now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                  {filtered.map((m) => (
                    <MediaTile
                      key={m.id}
                      media={m}
                      onOpen={() => nav(`/media/${m.id}`)} // ✅ guaranteed open on click
                      onEdit={() => setEditing(m)}
                      onDelete={() => setDeleting(m)}
                    />
                  ))}

                  <button
                    onClick={() => nav("/upload")}
                    className="aspect-square rounded-2xl border-2 border-dashed border-[#D8E2FF] bg-white/60 grid place-items-center text-gray-400 hover:bg-white transition"
                  >
                    <div className="text-center">
                      <div className="text-xl">＋</div>
                      <div className="mt-1 text-[12px] font-semibold">Add more</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ✅ One edit modal */}
      <EditMediaModal
        open={!!editing}
        initialTitle={editing?.title ?? ""}
        initialDescription={editing?.description ?? ""}
        onClose={() => setEditing(null)}
        onSubmit={async ({ title, description }) => {
          if (!editing) return;

          const res = await MediaAPI.update(editing.id, { title, description });
          const updated = res.data.data;

          onMediaUpdated(editing.id, {
            title: updated.title ?? title,
            description: updated.description ?? description,
            updatedAt: updated.updatedAt ?? editing.updatedAt,
          });

          setEditing(null);
        }}
      />

      {/* ✅ One delete modal */}
      <DeleteConfirmModal
        open={!!deleting}
        title={((deleting?.title ?? "").trim() || "Untitled") as string}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          await MediaAPI.remove(deleting.id);
          onMediaDeleted(deleting.id);
          setDeleting(null);
        }}
      />
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

function LinkTab({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="relative text-sm font-semibold text-gray-500 hover:text-gray-800">
      {children}
      <span className="absolute left-0 -bottom-3 h-[2px] w-0 bg-transparent" />
    </button>
  );
}

/* ---------------- Media tile (click open + menu) ---------------- */

function MediaTile({
  media,
  onOpen,
  onEdit,
  onDelete,
}: {
  media: ProfileMediaItem;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const type = normalizeMediaType(media.type, media.url);
  const isVideo = type === "VIDEO";

  const likes = media.likesCount ?? 0;
  const comments = media.commentCount ?? 0;
  const title = (media.title ?? "").trim() || "Untitled";
  const desc = (media.description ?? "").trim();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e: MouseEvent) => {
      const el = menuRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!menuOpen) onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!menuOpen) onOpen();
        }
      }}
      className="
        relative group aspect-square rounded-2xl overflow-hidden cursor-pointer
        bg-white border border-[#E7ECFF]
        shadow-[0_10px_30px_rgba(16,24,40,0.06)]
        transition-transform duration-300 ease-out
        hover:-translate-y-[2px]
        hover:shadow-[0_18px_50px_rgba(16,24,40,0.12)]
        outline-none focus:ring-4 focus:ring-blue-100
      "
      aria-label={`Open media: ${title}`}
    >
      {/* Media */}
      <div className="absolute inset-0 z-0">
        <MediaThumb media={media} />
      </div>

      {/* video badge */}
      {isVideo && (
        <div className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-white/90 border border-[#E7ECFF] shadow-sm grid place-items-center text-gray-800 text-[12px]">
          ▶
        </div>
      )}

      {/* 3 dots (visible on touch, hover on desktop) */}
      <div className="absolute top-3 left-3 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="h-8 w-8 rounded-full bg-white/90 border border-[#E7ECFF] shadow-sm grid place-items-center text-gray-800 hover:bg-white transition"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Media actions"
          >
            <span className="text-lg leading-none">⋯</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-[#E7ECFF] shadow-[0_12px_32px_rgba(16,24,40,0.14)] p-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                Edit title & description
              </MenuItem>

              <MenuItem
                danger
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Delete
              </MenuItem>
            </div>
          )}
        </div>
      </div>

      {/* Hover overlay */}
      <div
        className="
          absolute inset-0 z-20 pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-out
        "
      >
        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-black/75 via-black/25 to-transparent
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300 ease-out
          "
        />

        <div
          className="
            absolute bottom-3 left-3 right-3
            flex items-end justify-between gap-3
            translate-y-2 opacity-0
            group-hover:translate-y-0 group-hover:opacity-100
            transition-all duration-300 ease-out
          "
        >
          <div className="min-w-0">
            <div className="text-white text-sm font-semibold truncate drop-shadow-sm">{title}</div>
            {desc && <div className="text-white/80 text-xs truncate mt-0.5 drop-shadow-sm">{desc}</div>}
          </div>

          <div
            className="
              flex items-center gap-2 shrink-0
              scale-95 opacity-0
              group-hover:scale-100 group-hover:opacity-100
              transition-all duration-300 ease-out delay-75
            "
          >
            <StatPill icon="❤" value={likes} />
            <StatPill icon="💬" value={comments} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition",
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-[#F6F8FF]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatPill({ icon, value }: { icon: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-black/35 border border-white/10 backdrop-blur px-2 py-1">
      <span className="text-[12px]">{icon}</span>
      <span className="text-white text-xs font-semibold">{value}</span>
    </div>
  );
}

/* ---------------- Modals ---------------- */

function EditMediaModal({
  open,
  initialTitle,
  initialDescription,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialTitle: string;
  initialDescription: string;
  onClose: () => void;
  onSubmit: (v: { title: string; description: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setDescription(initialDescription);
    setErr(null);
    setSaving(false);
  }, [open, initialTitle, initialDescription]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm grid place-items-center p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-[520px] rounded-2xl bg-white border border-[#E7ECFF] shadow-[0_18px_60px_rgba(16,24,40,0.25)] p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[16px] font-semibold text-gray-900">Edit media details</div>
            <div className="text-[12px] text-gray-500 mt-1">Update title and description for this post.</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-[#E7ECFF] bg-white hover:bg-[#F6F8FF] transition grid place-items-center text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#E7ECFF] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
              placeholder="e.g. My new post"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[110px] rounded-xl border border-[#E7ECFF] bg-white p-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 resize-none"
              placeholder="Write a short description…"
            />
          </div>

          {err && <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-[#E7ECFF] bg-white text-sm font-semibold text-gray-700 hover:bg-[#F6F8FF] transition"
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={async () => {
              setSaving(true);
              setErr(null);
              try {
                await onSubmit({ title: title.trim(), description: description.trim() });
              } catch (e: any) {
                setErr(e?.response?.data?.message ?? "Failed to update media");
              } finally {
                setSaving(false);
              }
            }}
            className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  open,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setDeleting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm grid place-items-center p-4"
      onMouseDown={() => !deleting && onClose()}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl bg-white border border-[#E7ECFF] shadow-[0_18px_60px_rgba(16,24,40,0.25)] p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[16px] font-semibold text-gray-900">Delete post</div>
            <div className="text-[12px] text-gray-500 mt-1">This action cannot be undone.</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-9 w-9 rounded-xl border border-[#E7ECFF] bg-white hover:bg-[#F6F8FF] transition grid place-items-center text-gray-700 disabled:opacity-60"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#E7ECFF] bg-[#F6F8FF] p-4">
          <div className="text-[12px] text-gray-500">You are deleting:</div>
          <div className="mt-1 text-[14px] font-semibold text-gray-900 truncate">{title}</div>
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-10 px-4 rounded-xl border border-[#E7ECFF] bg-white text-sm font-semibold text-gray-700 hover:bg-[#F6F8FF] transition disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              setErr(null);
              try {
                await onConfirm();
              } catch (e: any) {
                setErr(e?.response?.data?.message ?? "Failed to delete media");
                setDeleting(false);
              }
            }}
            className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
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
      className="
        h-full w-full object-cover
        transition-all duration-300 ease-out
        group-hover:scale-[1.06]
        group-hover:blur-[2px]
        group-hover:brightness-75
      "
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
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-white border border-[#E7ECFF] overflow-hidden">
          <div className="h-full w-full bg-[#F3F6FF]" />
        </div>
      ))}
    </div>
  );
}

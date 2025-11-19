// src/features/profile/ProfilePage.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { MediaItem } from "../../api/media";
import { UserAPI, type MeData } from "../../api/user";
import BottomNav from "../../components/BottomNav";

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

  // 🔧 حالة الـ Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

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

  // info عامة
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

  // ================================
  // Edit Handlers
  // ================================
  function startEdit() {
    if (!me) return;
    setIsEditing(true);
    setEditName(me.name);
    // لو عندك email في MeData
    // @ts-ignore
    setEditEmail((me as any).email ?? "");
    setEditFile(null);
    setEditPreview(null);
    setEditError(null);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditError(null);

    if (editPreview && editPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editPreview);
    }
    setEditFile(null);
    setEditPreview(null);
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setEditError("Please choose an image file.");
      return;
    }

    setEditError(null);
    if (editPreview && editPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editPreview);
    }

    setEditFile(f);
    const url = URL.createObjectURL(f);
    setEditPreview(url);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!me || saving) return;

    setSaving(true);
    setEditError(null);

    try {
      const res = await UserAPI.updateMe({
        name: editName.trim() || me.name,
        email: editEmail.trim() || (me as any).email,
        file: editFile ?? undefined,
      });

      const body = res.data;
      const updated = ((body as any).data ?? body) as MeData;

      setMe(updated);
      setItems((updated as any).media ?? items);

      setIsEditing(false);

      if (editPreview && editPreview.startsWith("blob:")) {
        URL.revokeObjectURL(editPreview);
      }
      setEditFile(null);
      setEditPreview(null);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile. Please try again.";
      setEditError(msg);
    } finally {
      setSaving(false);
    }
  }

  const currentEditAvatar = editPreview || avatarUrl;

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
                    {(me as any).email}
                  </p>
                  {joinedYear && (
                    <p className="text-xs text-[#a293bf] mt-0.5">
                      Joined in {joinedYear}
                    </p>
                  )}

                  {/* زرار Edit profile */}
                  <button
                    type="button"
                    onClick={startEdit}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#f3eefc] px-3 py-1.5 text-xs font-semibold text-[#7b6b8e] hover:bg-[#e5dbff] active:scale-95 transition"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      edit
                    </span>
                    <span>Edit profile</span>
                  </button>
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

              {/* 🔧 Edit Profile Card */}
              {isEditing && (
                <div className="mt-6 border-t border-[#f1edf9] pt-4 px-4">
                  <p className="text-xs font-semibold text-[#161118] mb-3">
                    Edit profile
                  </p>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {/* Avatar chooser */}
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-[#f3eefc] flex items-center justify-center overflow-hidden">
                        {currentEditAvatar ? (
                          <img
                            src={currentEditAvatar}
                            alt="Avatar preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[26px] text-[#a293bf]">
                            person
                          </span>
                        )}
                      </div>

                      <label className="cursor-pointer text-[11px] font-semibold text-[#7b6b8e] underline underline-offset-2">
                        Change photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="text-[11px] font-medium text-[#7b6b8e]">
                        Name
                      </label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#e3ddf5] bg-[#faf8ff] px-3 py-2 text-xs text-[#161118] outline-none focus:border-[#a855ff]"
                        placeholder="Your name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-[11px] font-medium text-[#7b6b8e]">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#e3ddf5] bg-[#faf8ff] px-3 py-2 text-xs text-[#161118] outline-none focus:border-[#a855ff]"
                        placeholder="name@example.com"
                      />
                    </div>

                    {editError && (
                      <p className="text-[11px] text-red-500">{editError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 rounded-xl border border-[#ddd4f0] bg-white py-2 text-xs font-semibold text-[#5b516c] active:scale-95 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-xl bg-gradient-to-r from-[#ff3fd1] to-[#a855ff] py-2 text-xs font-semibold text-white shadow-[0_10px_25px_rgba(168,85,255,0.5)] disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 transition"
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

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
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-[#e5e1f5]"
                      >
                        <img
                          src={m.thumbnailUrl || m.url}
                          alt={m.title || "Media"}
                          className="h-full w-full object-cover"
                        />

                        {/* Play icon لو فيديو */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm">
                              <span className="material-symbols-outlined text-[18px]">
                                play_arrow
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Hover overlay بعدد اللايكات */}
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

        {/* Bottom Navigation */}
        <BottomNav />

      </div>
    </div>
  );
}

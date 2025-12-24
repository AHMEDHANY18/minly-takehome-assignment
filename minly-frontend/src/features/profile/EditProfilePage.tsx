import { useEffect, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { http } from "@/shared/api/http";
import { useNavigate } from "react-router-dom";
import { ProfileAPI } from "@/features/profile/api/profile.api";
import { MediaAPI } from "@/features/media/api/media.api";

const MAX_AVATAR_MB = 5;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isImage(file: File) {
  return file.type?.startsWith("image/");
}

export default function EditProfilePage() {
  const nav = useNavigate();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // server data
  const [initialName, setInitialName] = useState("");
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // local preview (selected file)
  const previewUrl = useMemo(() => {
    if (!avatarFile) return null;
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    ProfileAPI.me()
      .then((res) => {
        if (!alive) return;
        const u = res.data?.data?.user;
        const n = String(u?.name ?? "");
        const a = (u?.avatarUrl ?? null) as string | null;

        setInitialName(n);
        setInitialAvatarUrl(a);
        setName(n);
      })
      .catch((error) => {
        if (!alive) return;
        setError(getErrorMessage(error, "Failed to load profile"));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  function pickAvatar() {
    fileRef.current?.click();
  }

  function onSelectAvatar(file: File) {
    setError(null);

    if (!isImage(file)) {
      setError("Avatar must be an image (image/*).");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError(`Avatar is too large. Max is ${MAX_AVATAR_MB}MB (${formatBytes(MAX_AVATAR_BYTES)}).`);
      return;
    }

    setAvatarFile(file);
    setUploadProgress(0);
  }

  async function uploadAvatarViaPresign(file: File) {
    setUploadingAvatar(true);
    setUploadProgress(0);

    // 1) presign (kind=avatar)
    const presignRes = await MediaAPI.presign({
      kind: "avatar",
      contentType: file.type,
      // type ممنوع هنا
    });

    const { key, uploadUrl } = presignRes.data.data;

    // 2) PUT to S3
    await http.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (evt) => {
        if (!evt.total) return;
        setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    });

    // 3) finalize (kind=avatar) -> backend يحدث user.avatarUrl
    const finalizeRes = await MediaAPI.finalize<{ avatarUrl?: string | null }>({
      kind: "avatar",
      key,
    });

    // نتوقع يرجع user
    const updatedUser = finalizeRes.data.data;
    const newAvatarUrl = updatedUser?.avatarUrl ?? null;
    setInitialAvatarUrl(newAvatarUrl);

    return updatedUser;
  }

  async function saveAll() {
    if (loading) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    setError(null);
    setToast(null);
    setSaving(true);

    try {
      // (A) لو اختار صورة: ارفعها presign + finalize
      if (avatarFile) {
        await uploadAvatarViaPresign(avatarFile);
      }

      // (B) update name لو اتغير
      if (trimmedName !== initialName.trim()) {
        await ProfileAPI.update({ name: trimmedName });
        setInitialName(trimmedName);
      }

      setAvatarFile(null);
      setToast("Profile updated successfully.");
      setTimeout(() => setToast(null), 2500);

      // ارجع للبروفايل
      nav("/profile");
    } catch (error) {
      setError(getErrorMessage(error, "Failed to update profile."));
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  }

  const currentAvatar = previewUrl || initialAvatarUrl;

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
            onClick={() => nav("/profile")}
            className="h-9 px-3 rounded-xl bg-white border border-[#E7ECFF] shadow-sm text-sm font-semibold text-gray-700 hover:bg-[#F6F8FF] transition"
          >
            Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-[#E7ECFF] bg-white shadow-[0_10px_30px_rgba(16,24,40,0.06)]">
          <div className="grid grid-cols-1 md:grid-cols-[420px_1fr]">
            {/* Left - avatar */}
            <div className="relative p-8 border-b md:border-b-0 md:border-r border-[#E7ECFF]">
              {/* subtle dots */}
              <div
                className="absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <div className="relative">
                <div className="text-lg font-semibold text-gray-900">Edit profile</div>
                <div className="mt-1 text-sm text-gray-500">Update your name and avatar.</div>

                <div className="mt-8 flex flex-col items-center text-center">
                  <div className="relative group">
                    {currentAvatar ? (
                      <img
                        src={currentAvatar}
                        alt="Avatar"
                        className="h-[140px] w-[140px] rounded-full object-cover border border-[#E7ECFF] shadow-sm"
                      />
                    ) : (
                      <div className="h-[140px] w-[140px] rounded-full bg-[#F7C9B5] grid place-items-center text-white text-4xl font-bold border border-[#E7ECFF] shadow-sm">
                        {(initialName?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}

                    {/* hover ring */}
                    <div className="absolute inset-0 rounded-full ring-0 ring-blue-200 group-hover:ring-8 transition" />
                  </div>

                  <div className="mt-5 w-full">
                    <button
                      onClick={pickAvatar}
                      disabled={saving || uploadingAvatar || loading}
                      className="h-11 w-full rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                    >
                      Change photo
                    </button>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onSelectAvatar(f);
                        e.currentTarget.value = "";
                      }}
                    />

                    <div className="mt-3 text-xs text-gray-500">
                      PNG/JPG/WebP • Max {MAX_AVATAR_MB}MB
                    </div>

                    {avatarFile && (
                      <div className="mt-3 rounded-xl border border-[#E7ECFF] bg-[#F6F8FF] p-3 text-left">
                        <div className="text-xs font-semibold text-gray-700 truncate">{avatarFile.name}</div>
                        <div className="mt-1 text-[11px] text-gray-500">
                          {formatBytes(avatarFile.size)} • {avatarFile.type}
                        </div>

                        {uploadingAvatar && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                              <span>Uploading…</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                              <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        )}

                        {!uploadingAvatar && (
                          <button
                            type="button"
                            onClick={() => setAvatarFile(null)}
                            className="mt-3 h-9 w-full rounded-xl border border-[#E7ECFF] bg-white text-xs font-semibold text-gray-700 hover:bg-[#F6F8FF] transition"
                            disabled={saving}
                          >
                            Remove selected photo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right - form */}
            <div className="p-8">
              {toast && (
                <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                  {toast}
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading || saving}
                    placeholder="Your name"
                    className="mt-2 w-full h-11 rounded-xl border border-[#E7ECFF] bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50"
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    This will be visible on your profile and posts.
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => nav("/profile")}
                    disabled={saving}
                    className="h-11 px-4 rounded-xl border border-[#E7ECFF] bg-white text-sm font-semibold text-gray-700 hover:bg-[#F6F8FF] transition disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={saveAll}
                    disabled={saving || loading}
                    className="h-11 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>

                {/* Loading skeleton */}
                {loading && (
                  <div className="rounded-2xl border border-[#E7ECFF] bg-[#F6F8FF] p-4 text-sm text-gray-500">
                    Loading profile…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}

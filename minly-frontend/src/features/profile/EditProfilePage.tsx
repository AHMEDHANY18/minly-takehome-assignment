import { useEffect, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
import { http } from "@/shared/api/http";
import { useNavigate } from "react-router-dom";
import { ProfileAPI } from "@/features/profile/api/profile.api";
import { MediaAPI } from "@/features/media/api/media.api";
import { presignKind } from "@/shared/constant";

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
      kind: presignKind.AVATAR,
      contentType: file.type,
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[720px]"
    >
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            Edit profile
          </h1>
          <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Update your name and avatar.
          </div>
        </div>

        <button
          onClick={() => nav("/profile")}
          className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition shrink-0"
        >
          Back
        </button>
      </div>

      {toast && (
        <div className="mb-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Form card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-6">
        {/* Avatar uploader */}
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={pickAvatar}
            disabled={saving || uploadingAvatar || loading}
            className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Change photo"
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Avatar"
                className="h-28 w-28 rounded-full object-cover bg-gray-100 dark:bg-zinc-800 ring-2 ring-gray-200 dark:ring-zinc-700 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-gray-100 dark:bg-zinc-800 grid place-items-center font-semibold text-gray-600 dark:text-zinc-300 text-4xl ring-2 ring-gray-200 dark:ring-zinc-700 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900">
                {(initialName?.[0] ?? "U").toUpperCase()}
              </div>
            )}

            {/* hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white">
              <div className="flex flex-col items-center gap-1">
                <CameraIcon />
                <span className="text-[11px] font-semibold">Change</span>
              </div>
            </div>
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

          <div className="mt-3 text-xs text-gray-400 dark:text-zinc-500">
            PNG/JPG/WebP • Max {MAX_AVATAR_MB}MB
          </div>

          {avatarFile && (
            <div className="mt-3 w-full max-w-[360px] rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 p-3 text-left">
              <div className="text-xs font-semibold text-gray-700 dark:text-zinc-200 truncate">
                {avatarFile.name}
              </div>
              <div className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                {formatBytes(avatarFile.size)} • {avatarFile.type}
              </div>

              {uploadingAvatar && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white dark:bg-zinc-900">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {!uploadingAvatar && (
                <button
                  type="button"
                  onClick={() => setAvatarFile(null)}
                  className="mt-3 inline-flex items-center justify-center h-9 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
                  disabled={saving}
                >
                  Remove selected photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="mt-8 grid grid-cols-1 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-zinc-100">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || saving}
              placeholder="Your name"
              className="mt-2 w-full h-11 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 px-3.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition disabled:opacity-50"
            />
            <div className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
              This will be visible on your profile and posts.
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-40 rounded-full bg-gray-200/70 dark:bg-zinc-800" />
              <div className="h-11 w-full rounded-xl bg-gray-200/70 dark:bg-zinc-800" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => nav("/profile")}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveAll}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy — quiet list row */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-sm p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Blocked users</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            Manage the people you've blocked.
          </div>
        </div>
        <button
          type="button"
          onClick={() => nav("/profile/blocked")}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 text-sm font-semibold active:scale-[0.98] transition shrink-0"
        >
          Manage
        </button>
      </div>
    </motion.div>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-2h7l1 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback)
  );
}

// src/features/upload/UploadPage.tsx
//المره دي احسن من المره اللي فاتت؟
import { useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { http } from "@/shared/api/http";
import { useNavigate } from "react-router-dom";
import { MediaAPI, type MediaType } from "@/features/media/api/media.api";
import { presignKind } from "@/shared/constant";
import { captureVideoThumbnail } from "@/features/upload/captureVideoThumbnail";
import { createImageThumbnail } from "@/features/upload/createImageThumbnail";

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_DESC = 2200;

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

function detectMediaType(file: File): MediaType {
  if (!file.type) throw new Error("File type is missing");
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  throw new Error("Unsupported file type (only image/* or video/*)");
}

export default function UploadPage() {
  const nav = useNavigate();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const mediaType = useMemo(() => {
    if (!file) return null;
    try {
      return detectMediaType(file);
    } catch {
      return null;
    }
  }, [file]);

  function resetAll() {
    setError(null);
    setProgress(0);
    setUploading(false);
    setFile(null);
  }

  function pickFile() {
    inputRef.current?.click();
  }

  function validateAndSetFile(f: File) {
    setError(null);

    if (f.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Max is ${MAX_SIZE_MB}MB.`);
      return;
    }

    try {
      detectMediaType(f);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unsupported file type");
      return;
    }

    setFile(f);
    setProgress(0);
  }

  async function uploadToPresignedUrl(uploadUrl: string, f: File) {
    await http.put(uploadUrl, f, {
      headers: {
        "Content-Type": f.type,
      },
      onUploadProgress: (evt) => {
        if (!evt.total) return;
        const p = Math.round((evt.loaded / evt.total) * 100);
        setProgress(p);
      },
    });
  }

  async function handleUpload() {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const type = detectMediaType(file);

      // 1) presign
      const presignRes = await MediaAPI.presign({
        kind: presignKind.MEDIA,
        contentType: file.type,
        type,
      });

      const { key, uploadUrl } = presignRes.data.data;

      // 2) PUT to S3
      await uploadToPresignedUrl(uploadUrl, file);

      // 2.5) generate + upload a thumbnail (best effort, never fails the upload)
      //      VIDEO → capture a frame, IMAGE → canvas downscale (max edge 480, jpeg 0.8)
      let thumbnailUrl: string | undefined;
      try {
        const blob =
          type === "VIDEO"
            ? await captureVideoThumbnail(file)
            : await createImageThumbnail(file);
        if (blob) {
          const thumbPresign = await MediaAPI.presign({
            kind: presignKind.THUMBNAIL,
            contentType: "image/jpeg",
          });
          await http.put(thumbPresign.data.data.uploadUrl, blob, {
            headers: { "Content-Type": "image/jpeg" },
          });
          thumbnailUrl = thumbPresign.data.data.publicUrl;
        }
      } catch {
        // graceful skip — the upload itself must not fail
        thumbnailUrl = undefined;
      }

      // 3) finalize (create DB record)
      await MediaAPI.finalize({
        kind: presignKind.MEDIA,
        key,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        type, // مهم للـ media
        thumbnailUrl,
      });

      // ✅ go back to feed
      nav("/feed");
    } catch (error) {
      setError(getErrorMessage(error, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      {/* Back */}
      <button
        onClick={() => nav("/feed")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition"
      >
        <span className="text-base">←</span>
        Back to feed
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_520px]">
          {/* Left */}
          <div className="p-8">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
              Create new post
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
              Share your photos and videos with the community.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a catchy title"
                  className="mt-2 w-full rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 px-3.5 py-2.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    Description
                  </label>
                  <div className="text-xs text-gray-400 dark:text-zinc-500">
                    {description.length}/{MAX_DESC}
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                  placeholder="Write a caption..."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 px-3.5 py-2.5 text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative border-t md:border-t-0 md:border-l border-gray-200/70 dark:border-zinc-800 p-8">
            {/* dotted background */}
            <div
              className="absolute inset-0 opacity-[0.45] dark:opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(#cbd5e1 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />

            <div className="relative">
              <div
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
                className={[
                  "rounded-2xl border-2 border-dashed bg-white/80 dark:bg-zinc-900/80 backdrop-blur transition-colors",
                  dragging
                    ? "border-blue-500 dark:border-blue-500"
                    : "border-gray-200 dark:border-zinc-700",
                  "p-6",
                ].join(" ")}
              >
                {!file ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <span className="text-lg">⬆</span>
                    </div>

                    <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      Drag &amp; drop media
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      Supports images and videos up to {MAX_SIZE_MB}MB
                    </div>

                    <button
                      onClick={pickFile}
                      className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition"
                    >
                      Browse files
                    </button>

                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) validateAndSetFile(f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                          {file.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                          {formatBytes(file.size)} ·
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {mediaType ?? "UNKNOWN"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={resetAll}
                        disabled={uploading}
                        className="shrink-0 inline-flex items-center justify-center h-8 px-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200/70 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800">
                      {mediaType === "IMAGE" && previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="h-[260px] w-full object-cover"
                        />
                      ) : mediaType === "VIDEO" && previewUrl ? (
                        <video
                          src={previewUrl}
                          controls
                          className="h-[260px] w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-[260px] place-items-center text-sm text-gray-500 dark:text-zinc-400">
                          Preview not available
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    {uploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                          <span>Uploading...</span>
                          <span className="tabular-nums">{progress}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-xl border border-red-200/70 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Footer buttons (right aligned like screenshot) */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    resetAll();
                    nav("/feed");
                  }}
                  disabled={uploading}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploading && (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  )}
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-400 dark:text-zinc-500">
                We automatically detect <span className="font-medium">IMAGE</span> vs{" "}
                <span className="font-medium">VIDEO</span> from the file type and
                send it to the backend.
              </p>
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

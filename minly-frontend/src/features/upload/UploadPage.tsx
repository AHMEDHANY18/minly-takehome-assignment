// src/features/upload/UploadPage.tsx
import React, { useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MediaAPI, type MediaType } from "../../api/media";

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
    } catch (e: any) {
      setError(e?.message ?? "Unsupported file type");
      return;
    }

    setFile(f);
    setProgress(0);
  }

  async function uploadToPresignedUrl(uploadUrl: string, f: File) {
    // ✅ axios gives progress in browser
    await axios.put(uploadUrl, f, {
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
        contentType: file.type,
        type,
      });

      const { key, uploadUrl } = presignRes.data.data;

      // 2) PUT to S3
      await uploadToPresignedUrl(uploadUrl, file);

      // 3) finalize (create DB record)
      await MediaAPI.finalize({
        key,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        type,
      });

      // ✅ go back to feed
      nav("/feed");
    } catch (e: any) {
      // Backend: MISSING_CONTENT_TYPE, TYPE_MISMATCH, ...
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Upload failed. Please try again.";
      setError(String(msg));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      {/* Back */}
      <button
        onClick={() => nav("/feed")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <span className="text-base">←</span>
        Back to feed
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_520px]">
          {/* Left */}
          <div className="p-8">
            <h1 className="text-xl font-semibold text-gray-900">
              Create new post
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Share your photos and videos with the community.
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your post a catchy title"
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Description
                  </label>
                  <div className="text-xs text-gray-400">
                    {description.length}/{MAX_DESC}
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
                  placeholder="Write a caption..."
                  rows={5}
                  className="mt-2 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300"
                />
              </div>

              {/* ✅ Removed: hashtags, mention, location (as requested) */}
            </div>
          </div>

          {/* Right */}
          <div className="relative border-l border-gray-100 p-8">
            {/* dotted background */}
            <div
              className="absolute inset-0 opacity-[0.45]"
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
                  "rounded-2xl border-2 border-dashed bg-white/80 backdrop-blur",
                  dragging ? "border-blue-400" : "border-blue-200",
                  "p-6",
                ].join(" ")}
              >
                {!file ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600">
                      <span className="text-lg">⬆</span>
                    </div>

                    <div className="mt-4 text-sm font-semibold text-gray-900">
                      Drag &amp; drop media
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Supports images and videos up to {MAX_SIZE_MB}MB
                    </div>

                    <button
                      onClick={pickFile}
                      className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
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
                        // reset so selecting same file again triggers change
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {file.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formatBytes(file.size)} •{" "}
                          <span className="font-medium">
                            {mediaType ?? "UNKNOWN"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={resetAll}
                        disabled={uploading}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white">
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
                        <div className="grid h-[260px] place-items-center text-sm text-gray-500">
                          Preview not available
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    {uploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Uploading...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-blue-500 transition-all"
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
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-400">
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

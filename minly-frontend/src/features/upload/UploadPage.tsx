// src/features/upload/UploadPage.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MediaAPI } from "../../api/media";

export default function UploadPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

  const isVideo = useMemo(
    () => Boolean(previewUrl && file?.type?.startsWith("video/")),
    [file?.type, previewUrl]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [previewUrl, redirectTimer]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
      setError("Please select an image or video file.");
      return;
    }

    setError(null);
    setFile(f);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!file) {
      setError("Please choose an image or video to upload.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await MediaAPI.uploadMedia({
        file,
        title: title.trim(),
        description: description.trim(),
      });

      setSuccess(true);
      const timerId = window.setTimeout(() => navigate("/"), 500);
      setRedirectTimer(timerId);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-1 pb-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mt-3 bg-white rounded-3xl shadow p-4">
          <div className="aspect-3/4 w-full bg-[#f0edf7] rounded-3xl overflow-hidden">
            {previewUrl ? (
              isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                <img
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#aca0c2]">
                <span className="material-symbols-outlined text-[40px]">
                  image
                </span>
                <p className="text-sm mt-2">Tap to choose photo or video</p>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-3">
            <label className="cursor-pointer px-4 py-2 bg-white rounded-full shadow text-[#7c6189] text-xs font-semibold">
              Choose file
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium text-[#7b6b8e]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-xl bg-[#faf8ff]"
              placeholder="e.g. Sunset View"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium text-[#7b6b8e]">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-xl bg-[#faf8ff]"
            />
          </div>
        </div>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        {success && (
          <p className="text-center text-xs text-green-500">
            Uploaded! Redirecting...
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex-1 py-2 border rounded-xl bg-white text-[#5b516c]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 rounded-xl bg-linear-to-r from-[#ff3fd1] to-[#a855ff] text-white disabled:opacity-70"
          >
            {submitting ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}

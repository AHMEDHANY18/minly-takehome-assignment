// src/features/upload/UploadPage.tsx
import { useEffect, useState, type FormEvent } from "react";
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

  // Cleanup preview
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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
      setTimeout(() => navigate("/"), 500);
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

  function handleCancel() {
    navigate("/");
  }

  const isVideo =
    previewUrl && file?.type && file.type.startsWith("video/");

  return (
    <div className="min-h-screen bg-[#f7f6f8] flex justify-center">
      <div className="relative mx-auto w-full max-w-md flex-col bg-[#f7f6f8] min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 bg-[#f7f6f8]/90 backdrop-blur-sm z-20">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <button onClick={() => navigate("/")} className="p-1">
              <span className="material-symbols-outlined text-[22px]">
                close
              </span>
            </button>
            <h1 className="text-[15px] font-semibold">Upload Media</h1>
            <span className="w-6" />
          </div>
        </header>

        {/* Content */}
        <main className="px-4 pb-20">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="mt-3 bg-white rounded-3xl shadow p-4">

              {/* Preview */}
              <div className="aspect-[3/4] w-full bg-[#f0edf7] rounded-3xl overflow-hidden">
                {previewUrl ? (
                  isVideo ? (
                    <video src={previewUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={previewUrl} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#aca0c2]">
                    <span className="material-symbols-outlined text-[40px]">image</span>
                    <p className="text-sm mt-2">Tap to choose photo or video</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-3">
                <label className="cursor-pointer px-4 py-2 bg-white rounded-full shadow text-[#7c6189] text-xs font-semibold">
                  Choose file
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                </label>
              </div>

              {/* Title */}
              <div className="mt-4">
                <label className="text-xs font-medium text-[#7b6b8e]">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl bg-[#faf8ff]"
                  placeholder="e.g. Sunset View"
                />
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="text-xs font-medium text-[#7b6b8e]">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl bg-[#faf8ff]"
                />
              </div>
            </div>

            {error && <p className="text-center text-xs text-red-500">{error}</p>}
            {success && <p className="text-center text-xs text-green-500">Uploaded! Redirecting…</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 border rounded-xl bg-white text-[#5b516c]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#ff3fd1] to-[#a855ff] text-white"
              >
                {submitting ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 z-10 w-full max-w-md border-t border-zinc-200 bg-[#f7f6f8]/80 backdrop-blur-sm">
  <div className="flex h-16 items-center justify-around px-4">

    {/* Home */}
    <button
      type="button"
      onClick={() => navigate("/")}
      className="flex flex-col items-center gap-1 text-[#ad2bee]"
    >
      <span className="material-symbols-outlined filled">home</span>
      <span className="text-xs font-bold">Home</span>
    </button>

    {/* Upload */}
    <button
      type="button"
      onClick={() => navigate("/upload")}
      className="flex flex-col items-center gap-1 text-[#7c6189] hover:text-[#ad2bee]"
    >
      <span className="material-symbols-outlined">add_circle</span>
      <span className="text-xs font-medium">Upload</span>
    </button>

    {/* Profile */}
    <button
      type="button"
      onClick={() => navigate("/profile")}
      className="flex flex-col items-center gap-1 text-[#7c6189] hover:text-[#ad2bee]"
    >
      <span className="material-symbols-outlined">person</span>
      <span className="text-xs font-medium">Profile</span>
    </button>

  </div>
</nav>

      </div>
    </div>
  );
}

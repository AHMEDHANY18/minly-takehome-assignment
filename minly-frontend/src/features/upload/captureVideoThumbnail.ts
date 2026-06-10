/**
 * Captures a JPEG frame (~0.5s) from a video file using <video> + <canvas>.
 * Resolves to null on any failure — the upload must never break because of this.
 */
export function captureVideoThumbnail(
  file: File,
  timeoutMs = 8000
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    let settled = false;

    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(blob);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    video.onerror = () => finish(null);

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = duration > 0 ? Math.min(0.5, duration / 2) : 0;
      try {
        video.currentTime = target;
      } catch {
        finish(null);
      }
    };

    video.onseeked = () => {
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) {
          finish(null);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.8);
      } catch {
        finish(null);
      }
    };

    video.src = url;
  });
}

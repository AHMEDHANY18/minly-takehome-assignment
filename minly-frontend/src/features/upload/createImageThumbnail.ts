/**
 * Downscales an image file via <canvas> (max edge 480px, JPEG q0.8).
 * Resolves to null on any failure — the upload must never break because of this.
 */
export function createImageThumbnail(
  file: File,
  maxEdge = 480
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    let settled = false;

    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(blob);
    };

    const img = new Image();

    img.onerror = () => finish(null);

    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          finish(null);
          return;
        }

        const scale = Math.min(1, maxEdge / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.8);
      } catch {
        finish(null);
      }
    };

    img.src = url;
  });
}

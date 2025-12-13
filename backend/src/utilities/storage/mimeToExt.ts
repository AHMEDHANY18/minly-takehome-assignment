export function mimeToExt(mimetype: string): string {
    switch (mimetype) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      case "video/mp4":
        return "mp4";
      default:
        return "bin";
    }
  }

  export function assertAllowedContentType(contentType: string) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
    if (!allowed.has(contentType)) {
      throw new Error("UNSUPPORTED_CONTENT_TYPE");
    }
  }

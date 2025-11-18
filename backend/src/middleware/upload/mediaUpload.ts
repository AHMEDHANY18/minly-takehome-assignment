// src/middleware/upload/mediaUpload.ts
import multer from "multer";
import { Request } from "express";

const MAX_MEDIA_SIZE_MB = 20;
const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;

const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedVideoMimeTypes = ["video/mp4"];

const storage = multer.memoryStorage();

function fileFilter(
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const { mimetype } = file;

  const isImage = allowedImageMimeTypes.includes(mimetype);
  const isVideo = allowedVideoMimeTypes.includes(mimetype);

  if (!isImage && !isVideo) {
    return cb(
      new Error(
        "Unsupported file type. Only JPEG, PNG, WEBP images and MP4 videos are allowed."
      )
    );
  }

  cb(null, true);
}

export const mediaUpload = multer({
  storage,
  limits: {
    fileSize: MAX_MEDIA_SIZE_BYTES,
  },
  fileFilter,
}).single("file"); // 👈 اسم الفيلد اللي الفرونت هيبعتها

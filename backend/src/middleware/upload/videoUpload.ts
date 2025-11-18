const allowedVideoTypes = ["video/mp4"];
import multer from "multer";
import { Request } from "express";

export function videoFileFilter(
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!allowedVideoTypes.includes(file.mimetype)) {
    return cb(new Error("Only MP4 videos allowed"));
  }

  cb(null, true);
}

export const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB short video
  },
  fileFilter: videoFileFilter,
}).single("file");

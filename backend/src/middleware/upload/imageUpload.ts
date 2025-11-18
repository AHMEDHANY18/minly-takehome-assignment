import multer from "multer";
import { baseMulter } from "./multerConfig";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function imageFileFilter(
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!allowedImageTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP images are allowed"));
  }

  cb(null, true);
}

export const uploadImage = multer({
  storage: multer.memoryStorage(), // override
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: imageFileFilter,
}).single("file");

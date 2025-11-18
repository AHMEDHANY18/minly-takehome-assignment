import multer from "multer";

export const memoryStorage = multer.memoryStorage();

// ده البروفايل الأساسي — الباقي هيخصصوه
export const baseMulter = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

export const NOTIF_TYPE = {
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  FOLLOW: "FOLLOW",
  SYSTEM: "SYSTEM",
} as const;

// نوع TypeScript مستنتج تلقائيًا
export type NotificationTypeConst =
  typeof NOTIF_TYPE[keyof typeof NOTIF_TYPE];

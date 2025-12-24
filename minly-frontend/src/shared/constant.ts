export const PAGINATION = {
    DEFAULT_LIMIT: 10,
  } as const;


  export const presignKind = {
    AVATAR: "avatar",
    MEDIA: "media",
  } as const;

  export type PresignKind =
    (typeof presignKind)[keyof typeof presignKind];

export const NOTIF_TYPE = {
  LIKE: "LIKE",
  COMMENT: "COMMENT",
  FOLLOW: "FOLLOW",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationTypeConst =
  typeof NOTIF_TYPE[keyof typeof NOTIF_TYPE];


  export const MEDIA_TYPE = {
    IMAGE: "IMAGE",
    VIDEO: "VIDEO",
  } as const;

  export type MediaTypeConst = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

  export const PROFILE_MEDIA_TAB = {
    ALL: "ALL",
    IMAGE: MEDIA_TYPE.IMAGE,
    VIDEO: MEDIA_TYPE.VIDEO,
  } as const;

  export type ProfileMediaTabConst =
    (typeof PROFILE_MEDIA_TAB)[keyof typeof PROFILE_MEDIA_TAB];

  export function isProfileMediaTab(x: any): x is ProfileMediaTabConst {
    return x === PROFILE_MEDIA_TAB.ALL || x === PROFILE_MEDIA_TAB.IMAGE || x === PROFILE_MEDIA_TAB.VIDEO;
  }

  export const BOOKMARK_SORT = {
    RECENT: "recent",
    OLDEST: "oldest",
    POPULARITY: "popularity",
  } as const;

  export type BookmarkSortConst =
    typeof BOOKMARK_SORT[keyof typeof BOOKMARK_SORT];

  export const BOOKMARK_MEDIA_TYPE = {
    IMAGE: "image",
    VIDEO: "video",
  } as const;

  export type BookmarkMediaTypeConst =
    typeof BOOKMARK_MEDIA_TYPE[keyof typeof BOOKMARK_MEDIA_TYPE];
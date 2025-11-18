export const presignedType = {
  theme: "theme",
  avatar: "avatar",
};

export const presignedTypeValue = {
  theme: (themeVersionId: string, version: string): string => {
    return `theme/${themeVersionId}/${version}/`;
  },
};

export const couponStatus = {
  valid: "valid",
  invalid: "invalid",
  used: "used",
  expired: "expired",
} as const;

export type CouponStatus = (typeof couponStatus)[keyof typeof couponStatus];


export function isAllowedAppRedirect(u?: string | null) {
    if (!u) return false;
    return u.startsWith("minly://") || u.startsWith("exp://");
  }

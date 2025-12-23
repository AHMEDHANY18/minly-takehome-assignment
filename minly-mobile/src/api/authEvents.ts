// src/api/authEvents.ts
let onUnauthorized: null | (() => void | Promise<void>) = null;
let handling = false;

export function setOnUnauthorized(fn: typeof onUnauthorized) {
  onUnauthorized = fn;
}

export async function emitUnauthorized() {
  if (handling) return;
  handling = true;
  try {
    await onUnauthorized?.();
  } finally {
    handling = false;
  }
}

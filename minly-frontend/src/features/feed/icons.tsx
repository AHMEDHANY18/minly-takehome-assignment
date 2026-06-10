export function IconHeart({ filled }: { filled?: boolean }) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M20.84 4.61c-1.54-1.39-3.96-1.28-5.38.25L12 8.09 8.54 4.86C7.12 3.33 4.7 3.22 3.16 4.61c-1.72 1.55-1.82 4.2-.22 5.88L12 21.35l9.06-10.86c1.6-1.68 1.5-4.33-.22-5.88z"
          fill={filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

 export function IconComment() {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 14c0 1.1-.9 2-2 2H8l-4 4V6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v8z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  export function IconSend() {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M22 2 11 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M22 2 15 22l-4-9-9-4 20-7z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  export function IconBookmark({ filled }: { filled?: boolean }) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
        <path
          d="M6 3h12a1 1 0 0 1 1 1v18l-7-4-7 4V4a1 1 0 0 1 1-1z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  export function IconEye({ size = 18 }: { size?: number }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

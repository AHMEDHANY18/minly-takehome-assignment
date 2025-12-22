export function timeAgo(iso: string) {
    const t = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - t);

    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;

    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;

    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

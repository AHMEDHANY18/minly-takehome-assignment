// src/shared/utils/format.ts

/**
 * Compact number formatting: 950 -> "950", 1234 -> "1.2k", 4_500_000 -> "4.5m"
 * Tolerates missing/invalid input (returns "0").
 */
export function formatCompact(n?: number | null): string {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;

  if (v < 1000) return String(Math.floor(v));

  const units: { value: number; suffix: string }[] = [
    { value: 1_000_000_000, suffix: "b" },
    { value: 1_000_000, suffix: "m" },
    { value: 1_000, suffix: "k" },
  ];

  for (const u of units) {
    if (v >= u.value) {
      const scaled = v / u.value;
      const text =
        scaled >= 100
          ? String(Math.floor(scaled))
          : (Math.floor(scaled * 10) / 10).toFixed(1).replace(/\.0$/, "");
      return `${text}${u.suffix}`;
    }
  }

  return String(Math.floor(v));
}

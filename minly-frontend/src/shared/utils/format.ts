/**
 * Compact count formatting: 950 → "950", 1234 → "1.2k", 1_250_000 → "1.2m".
 * Tolerates undefined/null/negative values (returns "0").
 */
export function formatCompact(n?: number | null): string {
  const value = typeof n === "number" && Number.isFinite(n) ? n : 0;
  if (value <= 0) return "0";
  if (value < 1000) return String(Math.floor(value));

  const units: Array<{ v: number; s: string }> = [
    { v: 1_000_000_000, s: "b" },
    { v: 1_000_000, s: "m" },
    { v: 1_000, s: "k" },
  ];

  for (const u of units) {
    if (value >= u.v) {
      const x = value / u.v;
      const str =
        x >= 10
          ? String(Math.floor(x))
          : (Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, "");
      return `${str}${u.s}`;
    }
  }
  return String(Math.floor(value));
}

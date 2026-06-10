// src/utilities/extractMentions.ts

const MENTION_REGEX = /@([\p{L}\d_]+)/gu;

/**
 * Extracts unique @mention tokens from a text (case preserved,
 * deduped case-insensitively).
 */
export function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];

  const seen = new Set<string>();
  const mentions: string[] = [];

  for (const match of text.matchAll(MENTION_REGEX)) {
    const key = match[1].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    mentions.push(match[1]);
  }

  return mentions;
}

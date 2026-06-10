// src/utilities/extractHashtags.ts

const HASHTAG_REGEX = /#([\p{L}\d_]+)/gu;

/**
 * Extracts unique, lowercased hashtag tokens from a text.
 * "#Foo #bar #foo" -> ["foo", "bar"]
 */
export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];

  const tags = new Set<string>();
  for (const match of text.matchAll(HASHTAG_REGEX)) {
    tags.add(match[1].toLowerCase());
  }

  return [...tags];
}

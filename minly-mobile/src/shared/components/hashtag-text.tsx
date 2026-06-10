// src/shared/components/hashtag-text.tsx
import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { router } from "expo-router";

// matches contract regex /#([\p{L}\d_]+)/gu with a safe fallback
function hashtagRegex(): RegExp {
  try {
    return new RegExp("#([\\p{L}\\d_]+)", "gu");
  } catch {
    return /#(\w+)/g;
  }
}

export type TextPart = { value: string; tag: string | null };

export function splitHashtags(text: string): TextPart[] {
  const parts: TextPart[] = [];
  if (!text) return parts;

  const re = hashtagRegex();
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ value: text.slice(last, m.index), tag: null });
    parts.push({ value: m[0], tag: m[1].toLowerCase() });
    last = m.index + m[0].length;
  }

  if (last < text.length) parts.push({ value: text.slice(last), tag: null });
  return parts;
}

/**
 * Renders text with tappable #hashtags (must be nested inside a parent <Text>).
 */
export function HashtagText({
  text,
  tagStyle,
}: {
  text: string;
  tagStyle?: StyleProp<TextStyle>;
}) {
  const parts = splitHashtags(text ?? "");

  return (
    <>
      {parts.map((p, i) =>
        p.tag ? (
          <Text
            key={`${i}-${p.value}`}
            style={[{ color: "#2D7CFF", fontWeight: "700" }, tagStyle]}
            suppressHighlighting
            onPress={() =>
              router.push({
                pathname: "/hashtag/[tag]" as any,
                params: { tag: p.tag as string },
              })
            }
          >
            {p.value}
          </Text>
        ) : (
          <Text key={`${i}-t`}>{p.value}</Text>
        )
      )}
    </>
  );
}

import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";

import { timeAgo } from "@/shared/utils/time";
import { formatCompact } from "@/shared/utils/format";
import type { FeedItem } from "@/features/feed/api/feed.api";
import { InteractionsAPI } from "@/features/social/api/interactions.api";
import { HashtagText } from "@/shared/components/hashtag-text";

export function FeedCard({
  item,
  onOpenComments,
  onOpenProfile,
  onUpdated,
}: {
  item: FeedItem;
  onOpenComments: () => void;
  onOpenProfile: () => void;
  onUpdated: (patch: Partial<FeedItem>) => void;
}) {
  const [busyLike, setBusyLike] = useState(false);
  const [busyBookmark, setBusyBookmark] = useState(false);

  const subtitle = useMemo(() => timeAgo(item.createdAt), [item.createdAt]);

  const onToggleLike = async () => {
    if (busyLike) return;
    setBusyLike(true);

    const prevLiked = item.isLiked;
    const prevCount = item.likesCount;
    const optimisticNext = !prevLiked;

    // optimistic
    onUpdated({
      isLiked: optimisticNext,
      likesCount: prevCount + (optimisticNext ? 1 : -1),
    });

    try {
      const serverLiked = await InteractionsAPI.toggleLike(item.id);

      if (typeof serverLiked === "boolean") {
        const delta = (serverLiked ? 1 : 0) - (prevLiked ? 1 : 0); 
        onUpdated({
          isLiked: serverLiked,
          likesCount: prevCount + delta,
        });
      }
    } catch {
      // rollback
      onUpdated({ isLiked: prevLiked, likesCount: prevCount });
    } finally {
      setBusyLike(false);
    }
  };

  const onToggleBookmark = async () => {
    if (busyBookmark) return;
    setBusyBookmark(true);

    const prev = item.isBookmarked;
    const optimisticNext = !prev;

    onUpdated({ isBookmarked: optimisticNext });

    try {
      const serverBookmarked = await InteractionsAPI.toggleBookmark(item.id);
      if (typeof serverBookmarked === "boolean") {
        onUpdated({ isBookmarked: serverBookmarked });
      }
    } catch {
      onUpdated({ isBookmarked: prev });
    } finally {
      setBusyBookmark(false);
    }
  };

  const displayName = item.uploader?.name ?? "User";
  const avatarUrl = item.uploader?.avatarUrl ?? null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.userRow} onPress={onOpenProfile}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>{(displayName?.[0] ?? "U").toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.subText}>{subtitle}</Text>
          </View>
        </Pressable>

        <Pressable hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={18} color="#444" />
        </Pressable>
      </View>

      {/* Media */}
      <View style={styles.mediaWrap}>
        {item.type === "VIDEO" ? (
          <Video
            style={styles.media}
            source={{ uri: item.url }}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            isLooping
            posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
            posterStyle={styles.media}
          />
        ) : (
          <Image source={{ uri: item.url }} style={styles.media} />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={onToggleLike} hitSlop={10} style={styles.iconBtn}>
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={22}
              color={item.isLiked ? "#E53935" : "#111"}
            />
          </Pressable>

          <Pressable onPress={onOpenComments} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chatbubble-outline" size={21} color="#111" />
          </Pressable>

          <Pressable hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="paper-plane-outline" size={21} color="#111" />
          </Pressable>
        </View>

        <Pressable onPress={onToggleBookmark} hitSlop={10} style={styles.iconBtn}>
          <Ionicons
            name={item.isBookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color="#111"
          />
        </Pressable>
      </View>

      {/* Meta */}
      <View style={styles.meta}>
        <View style={styles.countsRow}>
          <Text style={styles.likesText}>
            {item.likesCount.toLocaleString()} likes
            {busyLike ? <Text style={styles.dim}>  • saving...</Text> : null}
          </Text>

          <View style={styles.viewsChip}>
            <Ionicons name="eye-outline" size={13} color="#777" />
            <Text style={styles.viewsText}>{formatCompact(item.viewsCount ?? 0)}</Text>
          </View>
        </View>

        {item.title || item.description ? (
          <Text style={styles.caption} numberOfLines={3}>
            <Text style={styles.captionUser}>{displayName} </Text>
            <HashtagText text={item.description ?? item.title ?? ""} />
          </Text>
        ) : null}

        <Pressable onPress={onOpenComments}>
          <Text style={styles.viewComments}>
            View all {item.commentCount.toLocaleString()} comments
          </Text>
        </Pressable>

        {busyBookmark ? (
          <View style={{ marginTop: 6 }}>
            <ActivityIndicator />
          </View>
        ) : null}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  avatarWrap: { width: 34, height: 34 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFallback: { backgroundColor: "#EEE", alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontWeight: "700", color: "#555" },
  userName: { fontWeight: "700", color: "#111", fontSize: 13 },
  subText: { color: "#777", fontSize: 11, marginTop: 1 },

  mediaWrap: { backgroundColor: "#F2F2F7" },
  media: { width: "100%", height: 360, backgroundColor: "#F2F2F7" },

  actions: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 4 },

  meta: { paddingHorizontal: 12, paddingBottom: 12 },
  countsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  likesText: { fontWeight: "700", color: "#111", fontSize: 12 },
  viewsChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewsText: { color: "#777", fontSize: 12, fontWeight: "600" },
  caption: { marginTop: 6, color: "#111", fontSize: 12, lineHeight: 18 },
  captionUser: { fontWeight: "700" },
  viewComments: { marginTop: 6, color: "#777", fontSize: 12 },
  dim: { color: "#777", fontWeight: "500" },
});

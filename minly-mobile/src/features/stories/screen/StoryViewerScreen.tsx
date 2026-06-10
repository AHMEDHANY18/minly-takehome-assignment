// src/features/stories/screen/StoryViewerScreen.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video, type AVPlaybackStatus } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";

import { StoriesAPI } from "@/features/stories/api/stories.api";
import { useStoriesStore } from "@/features/stories/store/stories.store";
import { timeAgo } from "@/shared/utils/time";
import { formatCompact } from "@/shared/utils/format";

const IMAGE_DURATION_MS = 5000;
const TICK_MS = 50;
const SCREEN_W = Dimensions.get("window").width;

export default function StoryViewerScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const groupUserId = String(userId);

  const groups = useStoriesStore((s) => s.groups);
  const meId = useStoriesStore((s) => s.meId);
  const loading = useStoriesStore((s) => s.loading);
  const load = useStoriesStore((s) => s.load);
  const markViewedLocal = useStoriesStore((s) => s.markViewedLocal);
  const removeStoryLocal = useStoriesStore((s) => s.removeStoryLocal);

  const group = useMemo(
    () => groups.find((g) => g.user.id === groupUserId) ?? null,
    [groups, groupUserId]
  );

  const isOwn = !!meId && groupUserId === meId;

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState(0); // bump to restart the current story timer
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const videoRef = useRef<Video>(null);
  const attemptedLoadRef = useRef(false);

  const stories = group?.stories ?? [];
  const current = stories[index];

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home" as any);
  }, [router]);

  /* ---------- navigation between stories ---------- */

  const goNext = useCallback(() => {
    if (!group) return;
    if (index < group.stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      close();
    }
  }, [group, index, close]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
    } else {
      // restart the first story
      setCycle((c) => c + 1);
      videoRef.current?.replayAsync().catch(() => {});
    }
  }, [index]);

  // keep latest callbacks reachable from the (once-created) PanResponder
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  const goPrevRef = useRef(goPrev);
  goPrevRef.current = goPrev;
  const closeRef = useRef(close);
  closeRef.current = close;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, gesture) => {
        // swipe down to close
        if (gesture.dy > 80) {
          closeRef.current();
          return;
        }
        // simple tap: left third = prev, rest = next
        if (Math.abs(gesture.dx) < 12 && Math.abs(gesture.dy) < 12) {
          if (evt.nativeEvent.pageX < SCREEN_W / 3) goPrevRef.current();
          else goNextRef.current();
        }
      },
    })
  ).current;

  /* ---------- data guards ---------- */

  // deep link / missing group: try one load, then close
  useEffect(() => {
    if (group) return;
    if (loading) return;
    if (!attemptedLoadRef.current) {
      attemptedLoadRef.current = true;
      load();
      return;
    }
    closeRef.current();
  }, [group, loading, load]);

  // clamp index when stories shrink (e.g. after delete); close if none left
  useEffect(() => {
    if (!group) return;
    if (group.stories.length === 0) {
      closeRef.current();
      return;
    }
    if (index >= group.stories.length) setIndex(group.stories.length - 1);
  }, [group, index]);

  /* ---------- per-story effects ---------- */

  // image auto-advance timer (cleared on story change / unmount)
  useEffect(() => {
    setProgress(0);
    if (!current || current.type !== "IMAGE") return;

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const p = (Date.now() - startedAt) / IMAGE_DURATION_MS;
      if (p >= 1) {
        clearInterval(timer);
        goNextRef.current();
      } else {
        setProgress(p);
      }
    }, TICK_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.type, cycle]);

  // mark viewed on show (skip own stories)
  useEffect(() => {
    if (!current || !group || isOwn) return;
    if (!current.viewed) {
      StoriesAPI.markViewed(current.id).catch(() => {});
      markViewedLocal(group.user.id, current.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, isOwn]);

  // own stories: load viewer count
  useEffect(() => {
    if (!current || !isOwn) return;
    let active = true;
    setViewerCount(null);

    StoriesAPI.viewers(current.id)
      .then((d) => {
        if (active) setViewerCount(d.count);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [current?.id, isOwn]);

  /* ---------- actions ---------- */

  const confirmDelete = () => {
    if (!current || !group || deleting) return;
    const storyId = current.id;

    Alert.alert("Delete story", "Are you sure you want to delete this story?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await StoriesAPI.remove(storyId);
            removeStoryLocal(group.user.id, storyId);
          } catch {
            Alert.alert("Error", "Failed to delete story");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const onVideoStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.durationMillis && status.durationMillis > 0) {
      setProgress(Math.min(1, (status.positionMillis ?? 0) / status.durationMillis));
    }
    if (status.didJustFinish) goNextRef.current();
  };

  /* ---------- render ---------- */

  if (!group || !current) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator color="#FFF" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Media (tap left/right, swipe down) */}
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        {current.type === "VIDEO" ? (
          <Video
            key={current.id}
            ref={videoRef}
            source={{ uri: current.url }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            onPlaybackStatusUpdate={onVideoStatus}
          />
        ) : (
          <Image
            key={current.id}
            source={{ uri: current.url }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Progress bars */}
        <View style={styles.progressRow} pointerEvents="none">
          {stories.map((s, i) => {
            const fill = i < index ? 1 : i === index ? progress : 0;
            return (
              <View key={s.id} style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${fill * 100}%` }]} />
              </View>
            );
          })}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {group.user.avatarUrl ? (
              <Image source={{ uri: group.user.avatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                <Text style={styles.headerAvatarText}>
                  {(group.user.name?.[0] ?? "U").toUpperCase()}
                </Text>
              </View>
            )}

            <View>
              <Text style={styles.headerName} numberOfLines={1}>
                {isOwn ? "Your story" : group.user.name}
              </Text>
              <Text style={styles.headerTime}>{timeAgo(current.createdAt)}</Text>
            </View>
          </View>

          <Pressable hitSlop={12} onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#FFF" />
          </Pressable>
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* Footer (own stories: viewers + delete) */}
        {isOwn ? (
          <View style={styles.footer}>
            <View style={styles.viewersChip}>
              <Ionicons name="eye-outline" size={16} color="#FFF" />
              <Text style={styles.viewersText}>
                {viewerCount === null ? "—" : formatCompact(viewerCount)}
              </Text>
            </View>

            <Pressable
              hitSlop={10}
              onPress={confirmDelete}
              disabled={deleting}
              style={[styles.deleteBtn, deleting && { opacity: 0.5 }]}
            >
              {deleting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#FFF" />
              )}
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  image: { width: "100%", height: "100%" },

  overlay: { flex: 1 },

  progressRow: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFF",
  },

  header: {
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#333" },
  headerAvatarFallback: { alignItems: "center", justifyContent: "center" },
  headerAvatarText: { color: "#FFF", fontWeight: "800" },
  headerName: { color: "#FFF", fontWeight: "800", fontSize: 13, maxWidth: 220 },
  headerTime: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 2 },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewersChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewersText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
  deleteBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    padding: 8,
  },
});

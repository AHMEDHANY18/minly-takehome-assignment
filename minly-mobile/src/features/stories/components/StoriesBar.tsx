// src/features/stories/components/StoriesBar.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect, useRouter } from "expo-router";

import { MediaAPI } from "@/features/media/api/media.api";
import { StoriesAPI, type StoryGroup, type StoryType } from "@/features/stories/api/stories.api";
import { useStoriesStore } from "@/features/stories/store/stories.store";

const RING_COLORS = ["#F58529", "#DD2A7B", "#8134AF", "#515BD4"] as const;
const GRAY_RING = ["#D1D5DB", "#D1D5DB"] as const;

type BarItem =
  | { kind: "own"; group: StoryGroup | null }
  | { kind: "user"; group: StoryGroup };

export function StoriesBar() {
  const router = useRouter();

  const groups = useStoriesStore((s) => s.groups);
  const meId = useStoriesStore((s) => s.meId);
  const meAvatarUrl = useStoriesStore((s) => s.meAvatarUrl);
  const load = useStoriesStore((s) => s.load);

  const [posting, setPosting] = useState(false);

  // refresh whenever Home regains focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const items = useMemo<BarItem[]>(() => {
    const own = meId ? groups.find((g) => g.user.id === meId) ?? null : null;
    const others = groups.filter((g) => g.user.id !== meId);
    return [{ kind: "own", group: own }, ...others.map((g) => ({ kind: "user" as const, group: g }))];
  }, [groups, meId]);

  const openViewer = (userId: string) => {
    router.push({
      pathname: "/story/[userId]" as any,
      params: { userId },
    });
  };

  const pickAndPost = async () => {
    if (posting) return; // can't double-post
    setPosting(true);

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Please allow access to your media library.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 1,
        videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
      });

      if (res.canceled) return;

      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      const mime = asset.mimeType || inferMimeType(asset.uri);
      if (!isAllowedMime(mime)) {
        Alert.alert("Unsupported file", "Only JPG, PNG, MP4 are supported.");
        return;
      }
      const type: StoryType = mime.startsWith("video/") ? "VIDEO" : "IMAGE";

      // 1) presign (existing media upload flow)
      const presignRes = await MediaAPI.presign({
        kind: "media",
        contentType: mime,
        type,
      });
      const { uploadUrl, publicUrl } = presignRes.data.data;

      // 2) PUT to presigned URL
      const up = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
        httpMethod: "PUT",
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { "Content-Type": mime },
      });
      if (up.status !== 200 && up.status !== 204) {
        throw new Error(`Upload failed with status ${up.status}`);
      }

      // 3) create the story
      await StoriesAPI.create({ url: publicUrl, type });

      // refresh so the new story shows up immediately
      await load();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Could not post your story.";
      Alert.alert("Error", msg);
    } finally {
      setPosting(false);
    }
  };

  const renderItem = ({ item }: { item: BarItem }) => {
    if (item.kind === "own") {
      const own = item.group;
      const avatar = own?.user.avatarUrl ?? meAvatarUrl;
      const hasStories = !!own && own.stories.length > 0;

      return (
        <Pressable
          style={styles.tile}
          disabled={posting}
          onPress={() => {
            if (hasStories && meId) openViewer(meId);
            else pickAndPost();
          }}
        >
          <View style={styles.ringWrap}>
            <LinearGradient
              colors={hasStories ? (own!.allViewed ? GRAY_RING : RING_COLORS) : GRAY_RING}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ring}
            >
              <View style={styles.ringInner}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={22} color="#9AA0AA" />
                  </View>
                )}
              </View>
            </LinearGradient>

            {posting ? (
              <View style={styles.busyOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            ) : (
              <Pressable hitSlop={6} style={styles.plusBadge} onPress={pickAndPost} disabled={posting}>
                <Ionicons name="add" size={13} color="#FFF" />
              </Pressable>
            )}
          </View>

          <Text style={styles.tileName} numberOfLines={1}>
            Your story
          </Text>
        </Pressable>
      );
    }

    const g = item.group;
    return (
      <Pressable style={styles.tile} onPress={() => openViewer(g.user.id)}>
        <View style={styles.ringWrap}>
          <LinearGradient
            colors={g.allViewed ? GRAY_RING : RING_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ring}
          >
            <View style={styles.ringInner}>
              {g.user.avatarUrl ? (
                <Image source={{ uri: g.user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {(g.user.name?.[0] ?? "U").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.tileName} numberOfLines={1}>
          {g.user.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(it) => (it.kind === "own" ? "own" : it.group.user.id)}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
      />
    </View>
  );
}

/* -------------------- helpers -------------------- */

function isAllowedMime(m: string) {
  return (
    m === "image/jpeg" || m === "image/jpg" || m === "image/png" || m === "video/mp4"
  );
}

function inferMimeType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "application/octet-stream";
}

/* -------------------- styles -------------------- */

const SIZE = 62;

const styles = StyleSheet.create({
  bar: {
    paddingVertical: 6,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 12,
  },

  tile: {
    width: SIZE + 8,
    alignItems: "center",
  },

  ringWrap: {
    width: SIZE,
    height: SIZE,
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: SIZE - 5,
    height: SIZE - 5,
    borderRadius: (SIZE - 5) / 2,
    backgroundColor: "#FAFAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: SIZE - 9,
    height: SIZE - 9,
    borderRadius: (SIZE - 9) / 2,
    backgroundColor: "#E9EAF0",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontWeight: "800",
    color: "#555",
    fontSize: 18,
  },

  plusBadge: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2D7CFF",
    borderWidth: 2,
    borderColor: "#FAFAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  busyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  tileName: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#444",
    maxWidth: SIZE + 8,
    textAlign: "center",
  },
});

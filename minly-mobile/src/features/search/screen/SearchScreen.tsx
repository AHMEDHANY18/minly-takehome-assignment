// src/features/search/screen/SearchScreen.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { SearchAPI, type SearchUser } from "../api/search.api";
import { useSearch } from "../hooks/useSearch";
import type { FeedItem } from "@/features/feed/api/feed.api";

type SearchTab = "users" | "media";

export default function SearchScreen() {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("users");

  // debounce input -> query
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const users = useSearch<SearchUser>(query, SearchAPI.users, 20);
  const media = useSearch<FeedItem>(query, SearchAPI.media, 20);

  const active = tab === "users" ? users : media;

  const openUser = (u: SearchUser) =>
    router.push({
      pathname: "/user/profile/[id]" as any,
      params: { id: u.id },
    });

  const openMedia = (m: FeedItem) =>
    router.push({
      pathname: "/media/[id]/details" as any,
      params: { id: m.id },
    });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        {/* Header + input */}
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </Pressable>

          <View style={styles.inputWrap}>
            <Ionicons name="search" size={16} color="#9AA0AA" />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Search users or media..."
              placeholderTextColor="#9AA0AA"
              style={styles.input}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {input.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setInput("")}>
                <Ionicons name="close-circle" size={16} color="#9AA0AA" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(["users", "media"] as SearchTab[]).map((t) => {
            const isActive = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {t === "users" ? "Users" : "Media"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Body */}
        {!query ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={26} color="#9AA0AA" />
            <Text style={styles.dim}>Type to search for people or posts</Text>
          </View>
        ) : active.loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.dim}>Searching...</Text>
          </View>
        ) : tab === "users" ? (
          <FlatList
            data={users.items}
            keyExtractor={(x) => x.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              if (users.hasMore && !users.loadingMore) users.loadMore();
            }}
            ListHeaderComponent={
              users.error ? <Text style={styles.errorText}>{users.error}</Text> : null
            }
            ListEmptyComponent={
              !users.error ? <Text style={styles.dimPad}>No users found.</Text> : null
            }
            renderItem={({ item }) => (
              <Pressable style={styles.userRow} onPress={() => openUser(item)}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
                ) : (
                  <View style={[styles.userAvatar, styles.avatarFallback]}>
                    <Text style={styles.avatarFallbackText}>
                      {(item.name?.[0] ?? "U").toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.userSub} numberOfLines={1}>
                    {item.followerCount} followers
                    {item.isFollowing ? " • Following" : ""}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color="#9AA3AF" />
              </Pressable>
            )}
            ListFooterComponent={
              users.loadingMore ? (
                <View style={{ paddingVertical: 14 }}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={media.items}
            keyExtractor={(x) => x.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              if (media.hasMore && !media.loadingMore) media.loadMore();
            }}
            ListHeaderComponent={
              media.error ? <Text style={styles.errorText}>{media.error}</Text> : null
            }
            ListEmptyComponent={
              !media.error ? <Text style={styles.dimPad}>No media found.</Text> : null
            }
            renderItem={({ item }) => (
              <Pressable style={styles.mediaRow} onPress={() => openMedia(item)}>
                <Image
                  source={{ uri: item.thumbnailUrl ?? item.url }}
                  style={styles.mediaThumb}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.mediaTitle} numberOfLines={1}>
                    {item.title || item.description || "Untitled"}
                  </Text>
                  <Text style={styles.userSub} numberOfLines={1}>
                    {item.uploader?.name ?? "User"} • {item.likesCount} likes
                  </Text>
                </View>

                {item.type === "VIDEO" ? (
                  <Ionicons name="play-circle-outline" size={18} color="#6B7280" />
                ) : (
                  <Ionicons name="image-outline" size={18} color="#6B7280" />
                )}
              </Pressable>
            )}
            ListFooterComponent={
              media.loadingMore ? (
                <View style={{ paddingVertical: 14 }}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFC" },
  shell: { flex: 1, paddingHorizontal: 12, paddingTop: 10 },

  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ECECF1",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 40,
  },
  input: { flex: 1, fontSize: 13, color: "#111", paddingVertical: 0 },

  tabsRow: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 8 },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F1F3F7",
  },
  tabPillActive: { backgroundColor: "#111" },
  tabText: { fontSize: 12, color: "#111", fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  dim: { color: "#777" },
  dimPad: { color: "#777", paddingVertical: 20, textAlign: "center" },
  errorText: { color: "#B42318", paddingVertical: 10 },

  userRow: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECF1",
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    backgroundColor: "#E9EAF0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontWeight: "700", color: "#555" },
  userName: { fontSize: 13, fontWeight: "800", color: "#111" },
  userSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },

  mediaRow: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECF1",
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mediaThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#F3F4F7" },
  mediaTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
});

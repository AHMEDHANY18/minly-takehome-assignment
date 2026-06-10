// src/features/hashtag/screen/HashtagScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { HashtagAPI } from "../api/hashtag.api";
import type { FeedItem } from "@/features/feed/api/feed.api";
import { FeedCard } from "@/features/feed/components/FeedCard";

export default function HashtagScreen() {
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const hashtag = String(tag ?? "").toLowerCase();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const [hasMore, setHasMore] = useState(false);

  const loadFirst = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) setRefreshing(true);
      else setInitialLoading(true);
      setError(null);

      try {
        pageRef.current = 1;
        const res = await HashtagAPI.list(hashtag, { page: 1, limit: 20 });

        setItems(res.items);
        hasMoreRef.current = res.hasMore;
        setHasMore(res.hasMore);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load hashtag");
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [hashtag]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current) return;

    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const res = await HashtagAPI.list(hashtag, { page: nextPage, limit: 20 });

      pageRef.current = nextPage;
      hasMoreRef.current = res.hasMore;
      setHasMore(res.hasMore);

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of res.items) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [hashtag, loadingMore]);

  const updateItem = useCallback((id: string, patch: Partial<FeedItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </Pressable>

        <Text style={styles.brand}>#{hashtag}</Text>

        <View style={{ width: 22 }} />
      </View>

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.dim}>Loading posts...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => loadFirst(true)}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadMore();
          }}
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Could not load posts</Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={() => loadFirst()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !error ? (
              <View style={styles.emptyBox}>
                <Ionicons name="pricetag-outline" size={26} color="#111" />
                <Text style={styles.emptyTitle}>No posts for #{hashtag} yet</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              onOpenComments={() =>
                router.push({
                  pathname: "/media/[id]/details" as any,
                  params: { id: item.id },
                })
              }
              onOpenProfile={() =>
                router.push({
                  pathname: "/user/profile/[id]" as any,
                  params: { id: item.uploader.id },
                })
              }
              onUpdated={(patch) => updateItem(item.id, patch)}
            />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFC" },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontWeight: "900", fontSize: 16, color: "#111" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  dim: { color: "#777" },

  errorBox: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F1F4",
  },
  errorTitle: { fontWeight: "900", color: "#111" },
  errorMsg: { marginTop: 4, color: "#777" },
  retryBtn: {
    marginTop: 10,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  retryText: { color: "#FFF", fontWeight: "900" },

  emptyBox: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontWeight: "900", fontSize: 14, color: "#111", textAlign: "center" },
});

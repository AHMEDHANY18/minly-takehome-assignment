import React, { useMemo, useState } from "react";
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
import { useRouter } from "expo-router";

import { useFeed } from "@/features/feed/hooks/useFeed";
import type { FeedMode } from "@/features/feed/api/feed.api";
import { FeedCard } from "@/features/feed/components/FeedCard";
import { SegmentedTabs } from "@/features/feed/components/SegmentedTabs";
import { SuggestedUsers } from "@/features/feed/components/SuggestedUsers";

export default function HomeScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<FeedMode>("home");
  const {
    items,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
    updateItem,
  } = useFeed(mode, 20);

  const data = useMemo(() => items, [items]);
  const isEmpty = !initialLoading && !error && data.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ width: 28 }} />
        <Text style={styles.brand}>Minly</Text>

        <Pressable
          hitSlop={10}
          onPress={() =>
            router.push({
              pathname: "/notification",
            })
          }
        >
          <Ionicons name="notifications-outline" size={22} color="#111" />
        </Pressable>
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabsWrap}>
        <SegmentedTabs value={mode} onChange={setMode} />
      </View>

      {/* Body */}
      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.dim}>Loading feed...</Text>
        </View>
      ) : isEmpty ? (
        <View style={{ flex: 1 }}>
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={26} color="#111" />
            <Text style={styles.emptyTitle}>Follow people to see content</Text>
            <Text style={styles.emptySub}>
            Try following a few accounts and your Home feed will fill up instantly.
            </Text>

            <Pressable style={styles.emptyBtn} onPress={reload}>
              <Text style={styles.emptyBtnText}>Refresh</Text>
            </Pressable>
          </View>

          <SuggestedUsers />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={reload}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadMore();
          }}
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Could not load feed</Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={reload}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <View>
              <FeedCard
                item={item}
                onOpenComments={() =>
                  router.push({
                    pathname: "/media/[id]/details",
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

              {index === 0 ? <SuggestedUsers /> : null}
            </View>
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
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFC",
  },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    fontWeight: "900",
    fontSize: 16,
    color: "#111",
  },

  tabsWrap: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  dim: {
    color: "#777",
  },

  errorBox: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F1F4",
  },

  errorTitle: {
    fontWeight: "900",
    color: "#111",
  },

  errorMsg: {
    marginTop: 4,
    color: "#777",
  },

  retryBtn: {
    marginTop: 10,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  retryText: {
    color: "#FFF",
    fontWeight: "900",
  },

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

  emptyTitle: {
    fontWeight: "900",
    fontSize: 14,
    color: "#111",
    textAlign: "center",
  },

  emptySub: {
    color: "#777",
    textAlign: "center",
    lineHeight: 18,
  },

  emptyBtn: {
    marginTop: 6,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  emptyBtnText: {
    color: "#FFF",
    fontWeight: "900",
  },
});

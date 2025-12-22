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

import { useFeed } from "../../hooks/useFeed";
import type { FeedMode } from "../../api/feed.api";
import { FeedCard } from "../../components/feed/FeedCard";
import { SegmentedTabs } from "../../components/home/SegmentedTabs";
import { SuggestedUsers } from "../../components/home/SuggestedUsers";

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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar (logo + title) */}
      <View style={styles.topBar}>
        <View style={styles.brandLeft}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Minly</Text>
        </View>

        <Pressable hitSlop={10} onPress={() => router.push("/notification")}>
          <Ionicons name="notifications-outline" size={20} color="#111" />
        </Pressable>
      </View>

      {/* Segmented tabs */}
      <View style={styles.tabsWrap}>
        <SegmentedTabs value={mode} onChange={setMode} />
      </View>

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.dim}>Loading feed...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => x.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
            ) : (
              <View style={{ height: 6 }} />
            )
          }
          renderItem={({ item, index }) => (
            <View>
              <FeedCard
                item={item}
                onOpenComments={() =>
                  router.push({ pathname: "/media/[id]", params: { id: item.id } })
                }
                onOpenProfile={() =>
                  router.push({
                    pathname: "/profile/[id]",
                    params: { id: item.uploader.id },
                  })
                }
                onUpdated={(patch) => updateItem(item.id, patch)}
              />

              {/* Suggested users block بعد أول بوست */}
              {index === 0 ? <SuggestedUsers /> : null}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <View style={{ height: 16 }} />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EFEFF3",
  },

  brandLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2F80ED",
  },
  brandText: { fontSize: 16, fontWeight: "900", color: "#111" },

  tabsWrap: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },

  listContent: { paddingBottom: 28 },

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
});

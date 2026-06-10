// src/features/messages/screen/ConversationsScreen.tsx
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useConversations } from "../hooks/useConversations";
import type { ConversationItem } from "../api/messages.api";
import { timeAgo } from "@/shared/utils/time";

function lastMessagePreview(c: ConversationItem) {
  if (!c.lastMessage) return "No messages yet";
  if (c.lastMessage.text) return c.lastMessage.text;
  if (c.lastMessage.mediaUrl) return "Sent a media";
  return "";
}

export default function ConversationsScreen() {
  const router = useRouter();
  const {
    items,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    reload,
    loadMore,
  } = useConversations(20);

  // refresh whenever the screen gains focus (badges/last messages move fast)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const openChat = (c: ConversationItem) => {
    router.push({
      pathname: "/messages/[id]" as any,
      params: {
        id: c.id,
        name: c.participant?.name ?? "Chat",
        avatarUrl: c.participant?.avatarUrl ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.shell}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </Pressable>

          <Text style={styles.headerTitle}>MESSAGES</Text>

          <View style={{ width: 22 }} />
        </View>

        {initialLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.dim}>Loading conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(x) => x.id}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={reload}
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              if (hasMore && !loadingMore) loadMore();
            }}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListHeaderComponent={
              error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorTitle}>Could not load messages</Text>
                  <Text style={styles.errorMsg}>{error}</Text>
                  <Pressable style={styles.retryBtn} onPress={reload}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !error ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="chatbubbles-outline" size={26} color="#111" />
                  <Text style={styles.emptyTitle}>No conversations yet</Text>
                  <Text style={styles.emptySub}>
                    Open someone&apos;s profile and tap Message to start a chat.
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => openChat(item)}>
                <View style={styles.avatarWrap}>
                  {item.participant?.avatarUrl ? (
                    <Image
                      source={{ uri: item.participant.avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarFallbackText}>
                        {(item.participant?.name?.[0] ?? "U").toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.participant?.name ?? "User"}
                    </Text>
                    {item.lastMessageAt ? (
                      <Text style={styles.time}>{timeAgo(item.lastMessageAt)}</Text>
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.preview,
                      item.unreadCount > 0 && styles.previewUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {lastMessagePreview(item)}
                  </Text>
                </View>

                {item.unreadCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            )}
            ListFooterComponent={
              loadingMore ? (
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
  safe: { flex: 1, backgroundColor: "#F2F2F4" },
  shell: { flex: 1, paddingHorizontal: 12, paddingTop: 10 },

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ECECF1",
    marginBottom: 10,
  },
  headerTitle: { fontSize: 12, fontWeight: "900", color: "#111", letterSpacing: 1 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  dim: { color: "#777" },

  row: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: "hidden" },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    backgroundColor: "#E9EAF0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontWeight: "700", color: "#555" },

  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontSize: 13, fontWeight: "900", color: "#111", flex: 1 },
  time: { fontSize: 11, color: "#8A8F99" },
  preview: { marginTop: 3, fontSize: 12, color: "#6B7280" },
  previewUnread: { color: "#111", fontWeight: "700" },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2D7CFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "900" },

  emptyBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontWeight: "900", fontSize: 14, color: "#111", textAlign: "center" },
  emptySub: { color: "#777", textAlign: "center", lineHeight: 18 },

  errorBox: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F1F4",
    marginBottom: 8,
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

// src/features/messages/screen/ChatScreen.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useChat } from "../hooks/useChat";
import type { ChatMessage } from "../api/messages.api";

function bubbleTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatScreen() {
  const router = useRouter();
  const { id, name, avatarUrl } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatarUrl?: string;
  }>();
  const conversationId = String(id);

  const chat = useChat(conversationId, 30);
  const [text, setText] = useState("");

  // mark-read on focus + poll every 5s while focused (cleared on blur/unmount)
  useFocusEffect(
    useCallback(() => {
      chat.markRead();

      const timer = setInterval(() => {
        chat.poll();
      }, 5000);

      return () => clearInterval(timer);
    }, [chat.markRead, chat.poll])
  );

  const submit = async () => {
    const v = text.trim();
    if (!v || chat.sending) return;

    setText("");
    const ok = await chat.send(v);
    if (!ok) setText(v); // restore on failure
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = chat.isMine(item);

    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {item.text ? (
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
              {item.text}
            </Text>
          ) : null}

          <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
            {bubbleTime(item.createdAt)}
            {item.id.startsWith("temp-") ? " • sending..." : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.shell}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#111" />
            </Pressable>

            <View style={styles.headerCenter}>
              {avatarUrl ? (
                <Image source={{ uri: String(avatarUrl) }} style={styles.headerAvatar} />
              ) : (
                <View style={[styles.headerAvatar, { backgroundColor: "#E9EAF0" }]} />
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {name ? String(name) : "Chat"}
              </Text>
            </View>

            <View style={{ width: 22 }} />
          </View>

          <View style={styles.card}>
            {chat.initialLoading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.dim}>Loading messages...</Text>
              </View>
            ) : (
              <FlatList
                data={chat.messages}
                inverted
                keyExtractor={(x) => x.id}
                renderItem={renderMessage}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                  // inverted list: end == oldest messages
                  if (chat.hasOlder && !chat.loadingOlder) chat.loadOlder();
                }}
                ListFooterComponent={
                  chat.loadingOlder ? (
                    <View style={{ paddingVertical: 12 }}>
                      <ActivityIndicator />
                    </View>
                  ) : chat.hasOlder ? (
                    <Pressable style={styles.loadOlderBtn} onPress={chat.loadOlder}>
                      <Text style={styles.loadOlderText}>Load older messages</Text>
                    </Pressable>
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    {/* inverted list flips children; flip back */}
                    <View style={{ transform: [{ scaleY: -1 }] }}>
                      <Text style={styles.emptyText}>
                        Say hi — this is the start of your conversation.
                      </Text>
                    </View>
                  </View>
                }
              />
            )}

            {chat.error ? (
              <View style={styles.errorBar}>
                <Text style={styles.errorBarText} numberOfLines={1}>
                  {chat.error}
                </Text>
              </View>
            ) : null}

            {/* Composer */}
            <View style={styles.composer}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Message..."
                placeholderTextColor="#9AA0AA"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={submit}
                maxLength={1000}
              />

              <Pressable
                disabled={chat.sending || !text.trim()}
                hitSlop={10}
                onPress={submit}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={chat.sending || !text.trim() ? "#B9C2CF" : "#2D7CFF"}
                />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F4" },
  shell: { flex: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },

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
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerAvatar: { width: 26, height: 26, borderRadius: 13 },
  headerTitle: { fontSize: 13, fontWeight: "900", color: "#111", maxWidth: 200 },

  card: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECECF1",
    flex: 1,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  dim: { color: "#777" },

  bubbleRow: { flexDirection: "row", marginVertical: 3 },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubbleRowTheirs: { justifyContent: "flex-start" },

  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: { backgroundColor: "#2D7CFF", borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#F3F4F7", borderBottomLeftRadius: 4 },

  bubbleText: { fontSize: 13, color: "#111", lineHeight: 18 },
  bubbleTextMine: { color: "#FFF" },

  bubbleTime: { marginTop: 4, fontSize: 9, color: "#8A8F99" },
  bubbleTimeMine: { color: "rgba(255,255,255,0.75)" },

  loadOlderBtn: { alignItems: "center", paddingVertical: 10 },
  loadOlderText: { fontSize: 11, color: "#2F80ED", fontWeight: "900" },

  emptyWrap: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: "#777", fontSize: 12 },

  errorBar: {
    backgroundColor: "#FDECEC",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorBarText: { color: "#B42318", fontSize: 11 },

  composer: {
    borderTopWidth: 1,
    borderTopColor: "#EFEFF3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F3F4F7",
    color: "#111",
    fontSize: 12,
  },
});

import React, { useMemo, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMediaDetails } from "@/hooks/useMediaDetails";


function timeAgoUpper(dateLike?: string) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins} MINS AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HOURS AGO`;
  const days = Math.floor(hrs / 24);
  return `${days} DAYS AGO`;
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(n);
  }
}

export default function PostDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mediaId = String(id);

  const {
    media,
    comments,
    meAvatarUrl,
    initialLoading,
    refreshing,
    loadingMore,
    addingComment,
    error,
    hasMore,
    loadMore,
    reload,
    toggleLike,
    toggleBookmark,
    addComment,
  } = useMediaDetails(mediaId, 20);

  const [text, setText] = useState("");

  const createdLabel = useMemo(
    () => timeAgoUpper(media?.createdAt),
    [media?.createdAt]
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.dim}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.shell}>
          {/* Header bar (back + POST + menu) */}
          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#111" />
            </Pressable>

            <Text style={styles.headerTitle}>POST</Text>

            <Pressable hitSlop={10}>
              <Ionicons name="ellipsis-horizontal" size={18} color="#111" />
            </Pressable>
          </View>

          <View style={styles.card}>
            <FlatList
              data={comments}
              keyExtractor={(x) => x.id}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={reload}
              onEndReachedThreshold={0.6}
              onEndReached={() => {
                if (hasMore && !loadingMore) loadMore();
              }}
              ListHeaderComponent={
                <>
                  {error ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorTitle}>Could not load post</Text>
                      <Text style={styles.errorMsg}>{error}</Text>
                      <Pressable style={styles.retryBtn} onPress={reload}>
                        <Text style={styles.retryText}>
                          {refreshing ? "Loading..." : "Retry"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {/* User row */}
                  <View style={styles.userRow}>
                    <View style={styles.userLeft}>
                      <View style={styles.avatarWrap}>
                        {media?.uploader?.avatarUrl ? (
                          <Image
                            source={{ uri: media.uploader.avatarUrl }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: "#E9EAF0" }]} />
                        )}
                      </View>

                      <View style={{ gap: 2 }}>
                        <Text style={styles.username}>
                          {media?.uploader?.name ?? "user"}
                        </Text>
                        <Text style={styles.location}> </Text>
                      </View>
                    </View>
                  </View>

                  {/* Media */}
                  <View style={styles.mediaWrap}>
                    {media?.url ? (
                      <Image source={{ uri: media.url }} style={styles.media} />
                    ) : (
                      <View style={[styles.media, { backgroundColor: "#F3F4F7" }]} />
                    )}
                  </View>

                  {/* Actions row (heart, comment, play/share, bookmark) */}
                  <View style={styles.actions}>
                    <View style={styles.actionsLeft}>
                      <Pressable hitSlop={10} onPress={toggleLike}>
                        <Ionicons
                          name={media?.isLiked ? "heart" : "heart-outline"}
                          size={22}
                          color={media?.isLiked ? "#E53935" : "#111"}
                        />
                      </Pressable>

                      <Pressable hitSlop={10}>
                        <Ionicons name="chatbubble-outline" size={20} color="#111" />
                      </Pressable>

                      <Pressable hitSlop={10}>
                        <Ionicons
                          // في التصميم عندك باين play. خليناه play لو فيديو، وإلا paper-plane
                          name={media?.type === "VIDEO" ? "play-outline" : "paper-plane-outline"}
                          size={20}
                          color="#111"
                        />
                      </Pressable>
                    </View>

                    <Pressable hitSlop={10} onPress={toggleBookmark}>
                      <Ionicons
                        name={media?.isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={20}
                        color="#111"
                      />
                    </Pressable>
                  </View>

                  {/* Meta */}
                  <View style={styles.meta}>
                    <Text style={styles.likes}>
                      {formatNumber(media?.likesCount ?? 0)} likes
                    </Text>

                    <Text style={styles.caption}>
                      <Text style={styles.captionUser}>
                        {media?.uploader?.name ?? "user"}{" "}
                      </Text>
                      {media?.description ?? media?.title ?? ""}
                    </Text>

                    <Text style={styles.time}>{createdLabel}</Text>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />
                </>
              }
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <View style={styles.commentAvatarWrap}>
                    {item.user.avatarUrl ? (
                      <Image source={{ uri: item.user.avatarUrl }} style={styles.commentAvatar} />
                    ) : (
                      <View style={[styles.commentAvatar, { backgroundColor: "#E9EAF0" }]} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentUser}>{item.user.name} </Text>
                      {item.text}
                    </Text>
                  </View>
                </View>
              )}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 14 }}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  <View style={{ height: 10 }} />
                )
              }
              contentContainerStyle={{ paddingBottom: 6 }}
            />

            {/* Composer bottom */}
            <View style={styles.composer}>
              <View style={styles.composerAvatarWrap}>
                {meAvatarUrl ? (
                  <Image source={{ uri: meAvatarUrl }} style={styles.composerAvatar} />
                ) : (
                  <View style={[styles.composerAvatar, { backgroundColor: "#E9EAF0" }]} />
                )}
              </View>

              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Add a comment..."
                placeholderTextColor="#9AA0AA"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={async () => {
                  const v = text.trim();
                  if (!v) return;
                  const ok = await addComment(v);
                  if (ok) setText("");
                }}
              />

              <Pressable
                disabled={addingComment || !text.trim()}
                hitSlop={10}
                onPress={async () => {
                  const v = text.trim();
                  if (!v) return;
                  const ok = await addComment(v);
                  if (ok) setText("");
                }}
              >
                <Text
                  style={[
                    styles.postBtn,
                    (addingComment || !text.trim()) && { opacity: 0.4 },
                  ]}
                >
                  {addingComment ? "Posting..." : "Post"}
                </Text>
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
  headerTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111",
    letterSpacing: 1,
  },

  card: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECECF1",
    flex: 1,
  },

  userRow: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10 },
  userLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: { width: 34, height: 34, borderRadius: 17, overflow: "hidden" },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  username: { fontSize: 13, fontWeight: "900", color: "#111" },
  location: { fontSize: 11, color: "#6B7280" },

  mediaWrap: { backgroundColor: "#F3F4F7" },
  media: { width: "100%", height: 360, resizeMode: "cover" },

  actions: {
    paddingHorizontal: 12,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: 14 },

  meta: { paddingHorizontal: 12, paddingTop: 10, gap: 6 },
  likes: { fontSize: 12, fontWeight: "900", color: "#111" },
  caption: { fontSize: 12, color: "#111", lineHeight: 16 },
  captionUser: { fontWeight: "900" },
  time: { fontSize: 11, color: "#6B7280", marginTop: 2, letterSpacing: 0.4 },

  divider: { height: 10 },

  commentRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  commentAvatarWrap: { width: 26, height: 26, borderRadius: 13, overflow: "hidden" },
  commentAvatar: { width: 26, height: 26, borderRadius: 13 },
  commentText: { fontSize: 12, color: "#111", lineHeight: 16 },
  commentUser: { fontWeight: "900" },

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
  composerAvatarWrap: { width: 26, height: 26, borderRadius: 13, overflow: "hidden" },
  composerAvatar: { width: 26, height: 26, borderRadius: 13 },
  input: {
    flex: 1,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F3F4F7",
    color: "#111",
    fontSize: 12,
  },
  postBtn: { fontSize: 12, fontWeight: "900", color: "#2F80ED" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  dim: { color: "#777" },

  errorBox: {
    backgroundColor: "#FFF",
    margin: 12,
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

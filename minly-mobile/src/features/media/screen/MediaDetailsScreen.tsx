import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { useMediaDetails } from "@/features/media/hooks/useMediaDetails";
import { useCommentReplies } from "@/features/media/hooks/useCommentReplies";
import type { MediaComment, ReplyItem } from "@/features/media/api/mediaDetails.api";
import { HashtagText } from "@/shared/components/hashtag-text";
import { ReportModal } from "@/features/social/components/ReportModal";
import type { ReportTargetType } from "@/features/social/api/report.api";
import { formatCompact } from "@/shared/utils/format";

/* ---------- Helpers ---------- */

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

function timeAgoSmall(dateLike?: string) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat("en-US").format(n);
  } catch {
    return String(n);
  }
}

function makeId() {
  // Expo عادةً بيدعم crypto.randomUUID، لكن ده fallback لو مش موجود
  const c: any = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOptimisticReply(text: string, meAvatarUrl?: string | null): ReplyItem {
  return {
    id: makeId(),
    text,
    createdAt: new Date().toISOString(),
    user: {
      id: "me",
      name: "You",
      avatarUrl: meAvatarUrl ?? null,
    },
  };
}

/* ---------- Comment Item (with replies) ---------- */

function CommentItem({
  item,
  meId,
  onPressReply,
  onEditComment,
  onReportComment,
  injectedReplies,
  onConsumeInjected,
}: {
  item: MediaComment;
  meId: string | null;
  onPressReply: (commentId: string, username: string) => void;
  onEditComment: (commentId: string, text: string) => Promise<boolean>;
  onReportComment: (commentId: string) => void;
  injectedReplies?: ReplyItem[];
  onConsumeInjected: (commentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const replies = useCommentReplies(item.id, 10);

  const isMine = !!meId && item.user?.id === meId;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [savingEdit, setSavingEdit] = useState(false);

  const repliesCount = item?._count?.replies ?? 0;

  const saveEdit = async () => {
    const v = editText.trim();
    if (!v || savingEdit) return;

    setSavingEdit(true);
    const ok = await onEditComment(item.id, v);
    setSavingEdit(false);

    if (ok) {
      setEditing(false);
    } else {
      Alert.alert("Error", "Failed to edit comment");
    }
  };

  const toggle = async () => {
    if (!expanded) {
      setExpanded(true);
      await replies.loadFirst();
    } else {
      setExpanded(false);
    }
  };

  // inject newly-created replies immediately if replies are expanded
  useEffect(() => {
    if (!expanded) return;
    if (!injectedReplies?.length) return;

    for (const r of injectedReplies) replies.addLocalReply(r);
    onConsumeInjected(item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, injectedReplies?.length]);

  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatarWrap}>
        {item.user?.avatarUrl ? (
          <Image source={{ uri: item.user.avatarUrl }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, { backgroundColor: "#E9EAF0" }]} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        {editing ? (
          <View>
            <TextInput
              value={editText}
              onChangeText={setEditText}
              style={styles.editInput}
              autoFocus
              multiline
              maxLength={500}
            />
            <View style={styles.commentMetaRow}>
              <Pressable hitSlop={10} disabled={savingEdit} onPress={saveEdit}>
                <Text style={styles.editSaveText}>
                  {savingEdit ? "Saving..." : "Save"}
                </Text>
              </Pressable>
              <Pressable
                hitSlop={10}
                disabled={savingEdit}
                onPress={() => {
                  setEditing(false);
                  setEditText(item.text);
                }}
              >
                <Text style={styles.replyBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.commentText}>
              <Text style={styles.commentUser}>{item.user?.name ?? "User"} </Text>
              {item.text}
              {item.isEdited ? <Text style={styles.editedMark}> (edited)</Text> : null}
            </Text>

            {/* meta row */}
            <View style={styles.commentMetaRow}>
              <Text style={styles.commentMetaTime}>{timeAgoSmall(item.createdAt)}</Text>

              <Pressable hitSlop={10} onPress={() => onPressReply(item.id, item.user?.name ?? "User")}>
                <Text style={styles.replyBtnText}>Reply</Text>
              </Pressable>

              {isMine ? (
                <Pressable
                  hitSlop={10}
                  onPress={() => {
                    setEditText(item.text);
                    setEditing(true);
                  }}
                >
                  <Text style={styles.replyBtnText}>Edit</Text>
                </Pressable>
              ) : (
                <Pressable hitSlop={10} onPress={() => onReportComment(item.id)}>
                  <Text style={styles.replyBtnText}>Report</Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {/* View replies */}
        {repliesCount > 0 ? (
          <Pressable hitSlop={10} onPress={toggle} style={{ marginTop: 8 }}>
            <Text style={styles.viewRepliesText}>
              {expanded ? "Hide replies" : `View replies (${repliesCount})`}
            </Text>
          </Pressable>
        ) : null}

        {/* Replies list */}
        {expanded ? (
          <View style={styles.repliesWrap}>
            {replies.loading ? (
              <ActivityIndicator />
            ) : (
              <>
                {replies.items.map((r) => (
                  <View key={r.id} style={styles.replyRow}>
                    <View style={styles.replyAvatarWrap}>
                      {r.user?.avatarUrl ? (
                        <Image source={{ uri: r.user.avatarUrl }} style={styles.replyAvatar} />
                      ) : (
                        <View style={[styles.replyAvatar, { backgroundColor: "#E9EAF0" }]} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.replyText}>
                        <Text style={styles.replyUser}>{r.user?.name ?? "You"} </Text>
                        {r.text}
                      </Text>
                      <Text style={styles.replyTime}>{timeAgoSmall(r.createdAt)}</Text>
                    </View>
                  </View>
                ))}

                {replies.loadingMore ? <ActivityIndicator /> : null}

                <Pressable hitSlop={10} onPress={replies.loadMore} style={{ marginTop: 6 }}>
                  <Text style={styles.loadMoreReplies}>Load more replies</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ---------- Screen ---------- */

type ReplyTarget = { commentId: string; username: string };

export default function PostDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mediaId = String(id);

  const inputRef = useRef<TextInput>(null);

  const {
    media,
    comments,
    meAvatarUrl,
    meId,
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
    editComment,
    deleteMedia,
  } = useMediaDetails(mediaId, 20);

  const [text, setText] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  // for instant UI: keep newly-created reply per commentId
  const [injectedReplies, setInjectedReplies] = useState<Record<string, ReplyItem[]>>({});

  // report modal target (media or a specific comment)
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
  } | null>(null);

  const isMyPost = !!meId && media?.uploader?.id === meId;

  const createdLabel = useMemo(() => timeAgoUpper(media?.createdAt), [media?.createdAt]);

  const confirmDeletePost = () => {
    Alert.alert("Delete post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteMedia();
          if (ok) router.back();
          else Alert.alert("Error", "Failed to delete media");
        },
      },
    ]);
  };

  const onPressPostMenu = () => {
    if (isMyPost) {
      confirmDeletePost();
    } else {
      setReportTarget({ type: "MEDIA", id: mediaId });
    }
  };

  const submit = async () => {
    if (addingComment) return;
    const v = text.trim();
    if (!v) return;

    // ✅ call API (hook) first
    const res = await addComment(v, replyTarget?.commentId);

    if (res.ok) {
      // ✅ only optimistic-inject replies locally (NEVER trust res.created shape)
      if (replyTarget?.commentId) {
        const optimistic = createOptimisticReply(v, meAvatarUrl);

        setInjectedReplies((prev) => ({
          ...prev,
          [replyTarget.commentId]: [
            optimistic,
            ...(prev[replyTarget.commentId] ?? []),
          ],
        }));
      }

      setText("");
      setReplyTarget(null);
    }
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#111" />
            </Pressable>

            <Text style={styles.headerTitle}>POST</Text>

            <Pressable hitSlop={10} onPress={onPressPostMenu}>
              <Ionicons
                name={isMyPost ? "trash-outline" : "flag-outline"}
                size={18}
                color="#111"
              />
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
                        <Text style={styles.retryText}>{refreshing ? "Loading..." : "Retry"}</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {/* User row */}
                  <View style={styles.userRow}>
                    <View style={styles.userLeft}>
                      <View style={styles.avatarWrap}>
                        {media?.uploader?.avatarUrl ? (
                          <Image source={{ uri: media.uploader.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: "#E9EAF0" }]} />
                        )}
                      </View>

                      <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{media?.uploader?.name ?? "user"}</Text>
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

                  {/* Actions */}
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
                    <View style={styles.statsRow}>
                      <Text style={styles.likes}>{formatNumber(media?.likesCount ?? 0)} likes</Text>

                      <View style={styles.viewsChip}>
                        <Ionicons name="eye-outline" size={14} color="#6B7280" />
                        <Text style={styles.viewsText}>
                          {formatCompact(media?.viewsCount ?? 0)} views
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.caption}>
                      <Text style={styles.captionUser}>{media?.uploader?.name ?? "user"} </Text>
                      <HashtagText text={media?.description ?? media?.title ?? ""} />
                    </Text>

                    <Text style={styles.time}>{createdLabel}</Text>
                  </View>

                  <View style={styles.divider} />
                </>
              }
              renderItem={({ item }) => (
                <CommentItem
                  item={item}
                  meId={meId}
                  onPressReply={(commentId, username) => {
                    setReplyTarget({ commentId, username });
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  onEditComment={editComment}
                  onReportComment={(commentId) =>
                    setReportTarget({ type: "COMMENT", id: commentId })
                  }
                  injectedReplies={injectedReplies[item.id]}
                  onConsumeInjected={(commentId) => {
                    setInjectedReplies((prev) => {
                      const copy = { ...prev };
                      delete copy[commentId];
                      return copy;
                    });
                  }}
                />
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

            {/* Composer */}
            <View style={styles.composer}>
              <View style={styles.composerAvatarWrap}>
                {meAvatarUrl ? (
                  <Image source={{ uri: meAvatarUrl }} style={styles.composerAvatar} />
                ) : (
                  <View style={[styles.composerAvatar, { backgroundColor: "#E9EAF0" }]} />
                )}
              </View>

              {replyTarget ? (
                <Pressable
                  hitSlop={10}
                  onPress={() => setReplyTarget(null)}
                  style={{ marginRight: 6 }}
                >
                  <Text style={styles.cancelReply}>Cancel</Text>
                </Pressable>
              ) : null}

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder={replyTarget ? `Reply to ${replyTarget.username}...` : "Add a comment..."}
                placeholderTextColor="#9AA0AA"
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={submit}
              />

              <Pressable disabled={addingComment || !text.trim()} hitSlop={10} onPress={submit}>
                <Text style={[styles.postBtn, (addingComment || !text.trim()) && { opacity: 0.4 }]}>
                  {addingComment ? "Posting..." : "Post"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReportModal
        visible={!!reportTarget}
        targetType={reportTarget?.type ?? "MEDIA"}
        targetId={reportTarget?.id ?? mediaId}
        onClose={() => setReportTarget(null)}
      />
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */

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
  headerTitle: { fontSize: 12, fontWeight: "900", color: "#111", letterSpacing: 1 },

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
  statsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  likes: { fontSize: 12, fontWeight: "900", color: "#111" },
  viewsChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewsText: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
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

  commentMetaRow: { flexDirection: "row", gap: 14, marginTop: 6, alignItems: "center" },
  commentMetaTime: { fontSize: 11, color: "#8A8F99" },
  replyBtnText: { fontSize: 11, color: "#6B7280", fontWeight: "800" },
  editedMark: { fontSize: 11, color: "#8A8F99", fontWeight: "400" },
  editSaveText: { fontSize: 11, color: "#2F80ED", fontWeight: "900" },
  editInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: "#111",
    backgroundColor: "#F9FAFB",
  },

  viewRepliesText: { fontSize: 11, color: "#6B7280", fontWeight: "800" },

  repliesWrap: { marginTop: 10, paddingLeft: 10, gap: 10 },
  replyRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  replyAvatarWrap: { width: 22, height: 22, borderRadius: 11, overflow: "hidden" },
  replyAvatar: { width: 22, height: 22, borderRadius: 11 },
  replyText: { fontSize: 12, color: "#111", lineHeight: 16 },
  replyUser: { fontWeight: "900" },
  replyTime: { fontSize: 11, color: "#8A8F99", marginTop: 4 },
  loadMoreReplies: { fontSize: 11, color: "#2F80ED", fontWeight: "900" },

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
  cancelReply: { fontSize: 12, fontWeight: "900", color: "#6B7280" },

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

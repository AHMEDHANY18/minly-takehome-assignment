import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";

import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import type {
  NotificationItem,
  NotificationType,
} from "@/features/notifications/api/notification.api";
import { SocialAPI } from "@/features/social/api/social.api";

type TabKey = "ALL" | "LIKE" | "COMMENT" | "FOLLOW" | "SYSTEM";

function normType(t: string): TabKey {
  const u = (t || "").toUpperCase();
  if (u === "LIKE") return "LIKE";
  if (u === "COMMENT") return "COMMENT";
  if (u === "FOLLOW") return "FOLLOW";
  if (u === "SYSTEM") return "SYSTEM";
  return "ALL";
}

function timeAgo(iso: string) {
  const ts = +new Date(iso);
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function buildText(n: NotificationItem) {
  const t = (n.type || "").toUpperCase() as NotificationType;
  const name = n.actor?.name ?? "Someone";

  switch (t) {
    case "LIKE":
      return { title: `${name} liked your post.`, subtitle: null as string | null };
    case "COMMENT":
      return {
        title: `${name} commented:`,
        subtitle: n.comment?.text ? `"${n.comment.text}"` : `"Nice!"`,
      };
    case "FOLLOW":
      return { title: `${name} started following you.`, subtitle: null as string | null };
    case "SYSTEM":
      return { title: `Minly Team:`, subtitle: n.comment?.text ?? "Welcome to the new update!" };
    default:
      return { title: `${name} sent you a notification.`, subtitle: null as string | null };
  }
}

function Avatar({ uri, name }: { uri: string | null | undefined; name: string }) {
  if (uri) return <Image source={{ uri }} style={styles.avatar} />;
  const letter = (name?.trim()?.[0] ?? "M").toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarLetter}>{letter}</Text>
    </View>
  );
}

function LeftSystemIcon() {
  return (
    <View style={styles.systemIconWrap}>
      <Ionicons name="sparkles" size={16} color="#2D7CFF" />
    </View>
  );
}

/** زر follow شيك + بيعتمد على checkFollow cache من الشاشة */
function FollowPill({
  userId,
  hasValue,
  isFollowing,
  busy,
  onEnsure,
  onToggle,
}: {
  userId: string;
  hasValue: boolean;
  isFollowing: boolean;
  busy: boolean;
  onEnsure: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  useEffect(() => {
    onEnsure(userId);
  }, [userId, onEnsure]);

  const label = isFollowing ? "Following" : "Follow Back";

  return (
    <Pressable
      onPress={() => onToggle(userId)}
      disabled={busy || !hasValue}
      style={({ pressed }) => [
        styles.followPill,
        isFollowing ? styles.followPillOutline : styles.followPillPrimary,
        (busy || !hasValue) && { opacity: 0.7 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {busy || !hasValue ? (
        <ActivityIndicator size="small" />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {isFollowing ? (
            <Ionicons name="checkmark" size={14} color="#111" />
          ) : (
            <Ionicons name="person-add" size={14} color="#FFF" />
          )}
          <Text style={[styles.followPillText, isFollowing && styles.followPillTextOutline]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function RightAccessory({
  n,
  followHasValue,
  followValue,
  followBusy,
  ensureFollow,
  toggleFollow,
}: {
  n: NotificationItem;
  followHasValue: (userId: string) => boolean;
  followValue: (userId: string) => boolean;
  followBusy: (userId: string) => boolean;
  ensureFollow: (userId: string) => void;
  toggleFollow: (userId: string) => void;
}) {
  const t = (n.type || "").toUpperCase();

  if (t === "FOLLOW") {
    if (!n.actorId) return null;

    return (
      <View style={{ alignItems: "flex-end" }}>
        <FollowPill
          userId={n.actorId}
          hasValue={followHasValue(n.actorId)}
          isFollowing={followValue(n.actorId)}
          busy={followBusy(n.actorId)}
          onEnsure={ensureFollow}
          onToggle={toggleFollow}
        />
      </View>
    );
  }

  if (n.media?.thumbnailUrl || n.media?.url) {
    const uri = n.media.thumbnailUrl ?? n.media.url!;
    return <Image source={{ uri }} style={styles.thumb} />;
  }

  if (t === "SYSTEM") {
    return <Ionicons name="chevron-forward" size={18} color="#B5B8C0" />;
  }

  return null;
}

function NotificationRow({
  item,
  onPress,
  followHasValue,
  followValue,
  followBusy,
  ensureFollow,
  toggleFollow,
}: {
  item: NotificationItem;
  onPress: () => void;
  followHasValue: (userId: string) => boolean;
  followValue: (userId: string) => boolean;
  followBusy: (userId: string) => boolean;
  ensureFollow: (userId: string) => void;
  toggleFollow: (userId: string) => void;
}) {
  const { title, subtitle } = buildText(item);
  const isSystem = (item.type || "").toUpperCase() === "SYSTEM";
  const actorName = item.actor?.name ?? "Minly";

  return (
    <View style={styles.row}>
      {/* unread dot */}
      <View style={styles.dotCol}>
        {!item.isRead ? <View style={styles.unreadDot} /> : <View style={styles.dotSpacer} />}
      </View>

      {/* main clickable area (prevents Follow button from opening row) */}
      <Pressable onPress={onPress} style={styles.mainPress}>
        <View style={styles.leftCol}>
          {isSystem ? <LeftSystemIcon /> : <Avatar uri={item.actor?.avatarUrl} name={actorName} />}
        </View>

        <View style={styles.body}>
          <Text style={styles.titleText}>
            <Text style={styles.bold}>{isSystem ? "Minly Team" : actorName}</Text>
            <Text>{" "}</Text>
            <Text style={styles.normal}>
              {isSystem ? `: ${subtitle ?? ""}` : title.replace(`${actorName} `, "")}
            </Text>
          </Text>

          {!isSystem && subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}

          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
      </Pressable>

      {/* right */}
      <View style={styles.rightCol}>
        <RightAccessory
          n={item}
          followHasValue={followHasValue}
          followValue={followValue}
          followBusy={followBusy}
          ensureFollow={ensureFollow}
          toggleFollow={toggleFollow}
        />
      </View>
    </View>
  );
}

export default function NotificationScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("ALL");

  const {
    items,
    unreadCount,
    initialLoading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    reload,
    loadMore,
    markRead,
    readAll,
  } = useNotifications(20);

  const filtered = useMemo(() => {
    if (tab === "ALL") return items;
    return items.filter((n) => normType(n.type) === tab);
  }, [items, tab]);

  const [markingAll, setMarkingAll] = useState(false);

  /** follow cache */
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  const followHasValue = (userId: string) => Object.prototype.hasOwnProperty.call(followMap, userId);
  const followValue = (userId: string) => followMap[userId] ?? false;
  const followBusy = (userId: string) => !!busyMap[userId];

  const ensureFollow = (userId: string) => {
    if (!userId) return;
    if (followHasValue(userId)) return;
    if (inFlightRef.current.has(userId)) return;

    inFlightRef.current.add(userId);

    SocialAPI.checkFollow(userId)
      .then((v) => {
        setFollowMap((prev) => ({ ...prev, [userId]: v }));
      })
      .catch(() => {
        // fallback
        setFollowMap((prev) => ({ ...prev, [userId]: false }));
      })
      .finally(() => {
        inFlightRef.current.delete(userId);
      });
  };

  const toggleFollow = async (userId: string) => {
    if (!userId) return;
    if (followBusy(userId)) return;

    const before = followValue(userId);

    // optimistic
    setFollowMap((prev) => ({ ...prev, [userId]: !before }));
    setBusyMap((prev) => ({ ...prev, [userId]: true }));

    try {
      const serverNext = await SocialAPI.toggleFollow(userId);
      if (typeof serverNext === "boolean") {
        setFollowMap((prev) => ({ ...prev, [userId]: serverNext }));
      }
    } catch (e) {
      // rollback
      setFollowMap((prev) => ({ ...prev, [userId]: before }));
    } finally {
      setBusyMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  async function onMarkAllRead() {
    if (unreadCount === 0) return;
    try {
      setMarkingAll(true);
      await readAll();
    } finally {
      setMarkingAll(false);
    }
  }

  function openNotification(n: NotificationItem) {
    if (!n.isRead) markRead(n.id);

    if (n.mediaId) {
      router.push({ pathname: "/media/[id]/details", params: { id: n.mediaId } });
      return;
    }
    if (n.actorId) {
      router.push({ pathname: "/profile/[id]", params: { id: n.actorId } });
      return;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        </View>

        <Pressable onPress={onMarkAllRead} disabled={unreadCount === 0 || markingAll} hitSlop={10}>
          {markingAll ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={[styles.markAll, unreadCount === 0 && { opacity: 0.4 }]}>Mark all read</Text>
          )}
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(
          [
            ["ALL", "All"],
            ["LIKE", "Likes"],
            ["COMMENT", "Comments"],
            ["FOLLOW", "Follows"],
            ["SYSTEM", "System"],
          ] as Array<[TabKey, string]>
        ).map(([k, label]) => {
          const active = tab === k;
          return (
            <Pressable
              key={k}
              onPress={() => setTab(k)}
              style={[styles.tabPill, active ? styles.tabPillActive : styles.tabPillIdle]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextIdle]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {initialLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.dim}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.id}
          refreshing={refreshing}
          onRefresh={reload}
          onEndReachedThreshold={0.6}
          onEndReached={() => {
            if (hasMore && !loadingMore) loadMore();
          }}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => openNotification(item)}
              followHasValue={followHasValue}
              followValue={followValue}
              followBusy={followBusy}
              ensureFollow={ensureFollow}
              toggleFollow={toggleFollow}
            />
          )}
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Could not load notifications</Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={reload}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={{ paddingVertical: 18 }}>
              {loadingMore ? <ActivityIndicator /> : <Text style={styles.noMore}>No more notifications</Text>}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111" },

  badge: {
    backgroundColor: "#2D7CFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: { color: "#FFF", fontWeight: "900", fontSize: 12 },

  markAll: { color: "#2D7CFF", fontWeight: "800" },

  tabs: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tabPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  tabPillActive: { backgroundColor: "#DDEBFF" },
  tabPillIdle: { backgroundColor: "#F2F3F6" },
  tabText: { fontWeight: "800", fontSize: 13 },
  tabTextActive: { color: "#2D7CFF" },
  tabTextIdle: { color: "#6B7280" },

  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F4",
    backgroundColor: "#FFF",
  },

  dotCol: { width: 12, alignItems: "center" },
  unreadDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#2D7CFF" },
  dotSpacer: { width: 8, height: 8 },

  mainPress: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  leftCol: { width: 44, alignItems: "center" },

  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#EEE" },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontWeight: "900", color: "#111" },

  systemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  body: { flex: 1, paddingRight: 10 },

  titleText: { fontSize: 13, color: "#111", lineHeight: 18 },
  bold: { fontWeight: "900" },
  normal: { fontWeight: "500", color: "#111" },

  subtitle: { marginTop: 4, fontSize: 13, color: "#6B7280", lineHeight: 18 },
  time: { marginTop: 6, fontSize: 12, color: "#9AA0AA" },

  rightCol: { width: 116, alignItems: "flex-end" },
  thumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#EEE" },

  // ✅ New follow pill styles
  followPill: {
    minWidth: 108,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  followPillPrimary: {
    backgroundColor: "#2D7CFF",
  },
  followPillOutline: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E6E8EF",
    elevation: 0,
    shadowOpacity: 0,
  },
  followPillText: { color: "#FFF", fontWeight: "900", fontSize: 12 },
  followPillTextOutline: { color: "#111" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  dim: { color: "#777" },

  errorBox: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginTop: 10,
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

  noMore: { textAlign: "center", color: "#B5B8C0", fontWeight: "700" },
});

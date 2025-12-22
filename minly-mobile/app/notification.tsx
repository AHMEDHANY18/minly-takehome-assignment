import React, { useMemo, useState } from "react";
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
import { useNotifications } from "../hooks/useNotifications";
import type { NotificationItem, NotificationType } from "../api/notification.api";

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
      return {
        title: `${name} liked your post.`,
        subtitle: null as string | null,
      };
    case "COMMENT":
      return {
        title: `${name} commented:`,
        subtitle: n.comment?.text ? `"${n.comment.text}"` : `"Nice!"`,
      };
    case "FOLLOW":
      return {
        title: `${name} started following you.`,
        subtitle: null as string | null,
      };
    case "SYSTEM":
      return {
        title: `Minly Team:`,
        subtitle: n.comment?.text ?? "Welcome to the new update!",
      };
    default:
      return {
        title: `${name} sent you a notification.`,
        subtitle: null as string | null,
      };
  }
}

function Avatar({ uri, name }: { uri: string | null | undefined; name: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  const letter = (name?.trim()?.[0] ?? "M").toUpperCase();
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarLetter}>{letter}</Text>
    </View>
  );
}

function RightAccessory({
  n,
}: {
  n: NotificationItem;
}) {
  const t = (n.type || "").toUpperCase();

  if (t === "FOLLOW") {
    // UI فقط (لو عندك endpoint follow/unfollow اربطه هنا)
    return (
      <View style={{ alignItems: "flex-end" }}>
        <Pressable style={styles.followBtn}>
          <Text style={styles.followBtnText}>Follow Back</Text>
        </Pressable>
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

function LeftSystemIcon() {
  return (
    <View style={styles.systemIconWrap}>
      <Ionicons name="sparkles" size={16} color="#2D7CFF" />
    </View>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const { title, subtitle } = buildText(item);
  const isSystem = (item.type || "").toUpperCase() === "SYSTEM";
  const actorName = item.actor?.name ?? "Minly";

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {/* unread dot */}
      <View style={styles.dotCol}>
        {!item.isRead ? <View style={styles.unreadDot} /> : <View style={styles.dotSpacer} />}
      </View>

      {/* left */}
      <View style={styles.leftCol}>
        {isSystem ? (
          <LeftSystemIcon />
        ) : (
          <Avatar uri={item.actor?.avatarUrl} name={actorName} />
        )}
      </View>

      {/* body */}
      <View style={styles.body}>
        <Text style={styles.titleText}>
          {/* Bold actor name / label */}
          <Text style={styles.bold}>
            {isSystem ? "Minly Team" : actorName}
          </Text>
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

      {/* right */}
      <View style={styles.rightCol}>
        <RightAccessory n={item} />
      </View>
    </Pressable>
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
    // mark read (optimistic)
    if (!n.isRead) markRead(n.id);

    // navigation
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

        <Pressable
          onPress={onMarkAllRead}
          disabled={unreadCount === 0 || markingAll}
          hitSlop={10}
        >
          {markingAll ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text
              style={[
                styles.markAll,
                (unreadCount === 0) && { opacity: 0.4 },
              ]}
            >
              Mark all read
            </Text>
          )}
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          ["ALL", "All"],
          ["LIKE", "Likes"],
          ["COMMENT", "Comments"],
          ["FOLLOW", "Follows"],
          ["SYSTEM", "System"],
        ] as Array<[TabKey, string]>).map(([k, label]) => {
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
            <NotificationRow item={item} onPress={() => openNotification(item)} />
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
              {loadingMore ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.noMore}>No more notifications</Text>
              )}
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

  rightCol: { width: 86, alignItems: "flex-end" },
  thumb: { width: 42, height: 42, borderRadius: 10, backgroundColor: "#EEE" },

  followBtn: {
    backgroundColor: "#2D7CFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  followBtnText: { color: "#FFF", fontWeight: "900", fontSize: 12 },

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

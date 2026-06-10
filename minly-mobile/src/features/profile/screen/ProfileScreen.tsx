import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useProfile } from "../hooks/useProfile";
import type { ProfileTab } from "../api/profile";
import { ProfileMediaCard } from "../components/ProfileMediaCard";

// saved/bookmarks
import { useSavedItems } from "@/features/saved/hooks/useSavedItems";
import { SavedGridCard } from "@/features/saved/components/SavedGridCard";

// DM + block
import { MessagesAPI } from "@/features/messages/api/messages.api";
import { BlockAPI } from "@/features/social/api/block.api";

type Props = {
  userId?: string;
  readonly?: boolean;
};

export default function ProfileScreen({ userId, readonly }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const PADDING = 16;
  const GAP = 12;
  const CARD = Math.floor((width - PADDING * 2 - GAP) / 2);

  const profile = useProfile(userId ?? null, "ALL", 24);

  // ✅ effective readonly: لو اتبعت readonly استخدمه، وإلا اعتمد على meta.isMe
  const effectiveReadonly = readonly ?? !profile.isMe;

  // DM + block state (other users' profiles only)
  const [dmBusy, setDmBusy] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!userId || !effectiveReadonly) return;

    let active = true;
    BlockAPI.isBlocked(userId)
      .then((v) => {
        if (active) setIsBlocked(v);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [userId, effectiveReadonly]);

  const onMessage = async () => {
    if (!userId || dmBusy) return;

    setDmBusy(true);
    try {
      // POST /conversation { userId } — get-or-create the 1:1 conversation
      const conv = await MessagesAPI.getOrCreate(userId);
      router.push({
        pathname: "/messages/[id]" as any,
        params: {
          id: conv.id,
          name: conv.participant?.name ?? profile.user?.name ?? "Chat",
          avatarUrl: conv.participant?.avatarUrl ?? profile.user?.avatarUrl ?? "",
        },
      });
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "Failed to open conversation"
      );
    } finally {
      setDmBusy(false);
    }
  };

  const doToggleBlock = async () => {
    if (!userId || blockBusy) return;

    setBlockBusy(true);
    try {
      // POST /block/:userId — toggle
      const res = await BlockAPI.toggle(userId);
      setIsBlocked(res.isBlocked);
      // blocking removes follow relations server-side; refresh counts
      profile.refresh();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "Failed to update block"
      );
    } finally {
      setBlockBusy(false);
    }
  };

  const onPressBlock = () => {
    if (!userId || blockBusy) return;
    const name = profile.user?.name ?? "this user";

    Alert.alert(
      isBlocked ? "Unblock user" : "Block user",
      isBlocked
        ? `Unblock ${name}? They will be able to message and follow you again.`
        : `Block ${name}? You will unfollow each other and they won't be able to message you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isBlocked ? "Unblock" : "Block",
          style: isBlocked ? "default" : "destructive",
          onPress: doToggleBlock,
        },
      ]
    );
  };

  const saved = useSavedItems(24);

  const TABS: { key: ProfileTab; label: string }[] = effectiveReadonly
    ? [
        { key: "ALL", label: "All Media" },
        { key: "VIDEOS", label: "Videos" },
        { key: "PHOTOS", label: "Photos" },
      ]
    : [
        { key: "ALL", label: "All Media" },
        { key: "VIDEOS", label: "Videos" },
        { key: "PHOTOS", label: "Photos" },
        { key: "SAVED", label: "Saved" },
      ];

  const filteredProfileItems = useMemo(() => {
    const t = profile.tab;
    if (t === "ALL") return profile.items;
    if (t === "VIDEOS")
      return profile.items.filter((x: any) => String(x.type).toUpperCase() === "VIDEO");
    if (t === "PHOTOS")
      return profile.items.filter((x: any) => String(x.type).toUpperCase() === "IMAGE");
    return profile.items;
  }, [profile.items, profile.tab]);

  const isSavedTab = !effectiveReadonly && profile.tab === "SAVED";
  const listData = isSavedTab ? saved.items : filteredProfileItems;

  const onRefresh = () => (isSavedTab ? saved.refresh() : profile.refresh());
  const refreshing = isSavedTab ? saved.refreshing : profile.refreshing;
  const onEndReached = () => (isSavedTab ? saved.loadMore() : profile.loadMore());

  // ✅ Loading (مش مربوط بـ user فقط)
  if (profile.loading && profile.items.length === 0 && !profile.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 16 }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const user = profile.user;
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#b00" }}>
            Failed to load profile{profile.error ? `: ${profile.error}` : ""}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listData as any[]}
        numColumns={2}
        key={profile.tab}
        keyExtractor={(it: any) => String(getItemId(it))}
        contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 24 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item }: any) => {
          if (isSavedTab) {
            return (
              <View style={{ width: CARD }}>
                <SavedGridCard item={item} />
              </View>
            );
          }

          return (
            <ProfileMediaCard
              item={item}
              size={CARD}
              onDeleted={effectiveReadonly ? undefined : (id) => profile.removeLocalItem(id)}
              onEdited={
                effectiveReadonly
                  ? undefined
                  : () =>
                      router.push({
                        pathname: "/media/edit" as any,
                        params: {
                          id: item.id,
                          title: item.title ?? "",
                          description: item.description ?? "",
                          url: item.url,
                          type: (item.type ?? "") as any,
                        },
                      })
              }
              onPress={() =>
                router.push({
                  pathname: "/media/[id]/details" as any,
                  params: { id: item.id },
                })
              }
            />
          );
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <Pressable onPress={() => router.back()} hitSlop={10}>
                <Ionicons name="arrow-back" size={22} color="#111" />
              </Pressable>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.headerCenter}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{
                    uri:
                      user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}&background=E9EEF5&color=111`,
                  }}
                  style={styles.avatar}
                />
              </View>

              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.handleLine}>
                @{slugify(user.name)} • {user.email}
              </Text>

              <View style={styles.joinRow}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.joinText}>Joined {formatMonthYear(user.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.ffRow}>
              <Pressable style={styles.ffBox}>
                <Text style={styles.ffValue}>{user.followerCount}</Text>
                <Text style={styles.ffLabel}>Followers</Text>
              </Pressable>

              <Pressable style={styles.ffBox}>
                <Text style={styles.ffValue}>{user.followingCount}</Text>
                <Text style={styles.ffLabel}>Following</Text>
              </Pressable>
            </View>

            {!effectiveReadonly ? (
              <Pressable
                style={styles.editBtn}
                onPress={() =>
                  router.push({
                    pathname: "/profile/edit" as any,
                    params: { name: user.name, avatarUrl: user.avatarUrl ?? "" },
                  })
                }
              >
                <Text style={styles.editText}>Edit Profile</Text>
              </Pressable>
            ) : userId ? (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.messageBtn, dmBusy && { opacity: 0.6 }]}
                  disabled={dmBusy}
                  onPress={onMessage}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                  <Text style={styles.messageText}>
                    {dmBusy ? "Opening..." : "Message"}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.blockBtn,
                    isBlocked && styles.blockBtnActive,
                    blockBusy && { opacity: 0.6 },
                  ]}
                  disabled={blockBusy}
                  onPress={onPressBlock}
                >
                  <Ionicons
                    name={isBlocked ? "lock-open-outline" : "ban-outline"}
                    size={16}
                    color={isBlocked ? "#111" : "#D92D20"}
                  />
                  <Text style={[styles.blockText, isBlocked && styles.blockTextActive]}>
                    {blockBusy ? "..." : isBlocked ? "Unblock" : "Block"}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.summaryCard}>
              <SummaryRow icon="cloud-upload-outline" value={user.mediaCount} label="Uploads" />
              <SummaryRow icon="heart-outline" value={user.totalLikesReceived} label="Likes Received" />
              <SummaryRow icon="thumbs-up-outline" value={user.totalLikesGiven} label="Likes Given" />
            </View>

            <View style={styles.tabsRow}>
              {TABS.map((t) => {
                const active = profile.tab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => profile.setTab(t.key)}
                    style={[styles.tabPill, active && styles.tabPillActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListFooterComponent={
          ((isSavedTab ? saved.loading : profile.loading) &&
            (isSavedTab ? saved.hasNext : profile.hasNext)) ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 24, paddingHorizontal: 16 }}>
            <Text style={{ color: "#777" }}>
              {isSavedTab ? "No saved items yet." : "No media yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function SummaryRow({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={18} color="#2D7CFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA3AF" />
    </View>
  );
}

function formatMonthYear(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function slugify(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");
}

function getItemId(it: any) {
  return it?.id ?? it?.media?.id ?? it?.mediaId ?? `${it?.key ?? "item"}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerCenter: { alignItems: "center", paddingTop: 10 },
  avatarWrap: { position: "relative" },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#E9EEF5" },

  name: { fontSize: 20, fontWeight: "700", color: "#111", marginTop: 8 },
  handleLine: { fontSize: 12, color: "#667085", marginTop: 2 },

  joinRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  joinText: { marginLeft: 6, fontSize: 12, color: "#667085" },

  ffRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    gap: 12,
  },
  ffBox: {
    flex: 1,
    maxWidth: 170,
    backgroundColor: "#F6F7FB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  ffValue: { fontSize: 16, fontWeight: "800", color: "#111" },
  ffLabel: { fontSize: 12, color: "#667085", marginTop: 2 },

  editBtn: {
    marginTop: 12,
    backgroundColor: "#2D7CFF",
    borderRadius: 24,
    paddingVertical: 11,
    alignItems: "center",
  },
  editText: { color: "#fff", fontWeight: "700" },

  actionsRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  messageBtn: {
    flex: 1,
    backgroundColor: "#2D7CFF",
    borderRadius: 24,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  messageText: { color: "#fff", fontWeight: "700" },
  blockBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F2C5C2",
    borderRadius: 24,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  blockBtnActive: { borderColor: "#D0D5DD" },
  blockText: { color: "#D92D20", fontWeight: "700" },
  blockTextActive: { color: "#111" },

  summaryCard: {
    marginTop: 14,
    backgroundColor: "#F6F7FB",
    borderRadius: 18,
    padding: 10,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: "#EAF2FF",
  },
  summaryValue: { fontSize: 14, fontWeight: "800", color: "#111" },
  summaryLabel: { fontSize: 12, color: "#667085", marginTop: 1 },

  tabsRow: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 10,
    gap: 10,
    flexWrap: "wrap",
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F1F3F7",
  },
  tabPillActive: { backgroundColor: "#111" },
  tabText: { fontSize: 12, color: "#111", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
});

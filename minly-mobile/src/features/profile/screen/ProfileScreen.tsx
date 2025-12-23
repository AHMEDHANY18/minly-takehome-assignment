import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  RefreshControl,
  TextInput, // ✅ NEW
  Alert,     // ✅ NEW (optional but nice)
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { router } from "expo-router";
import { UserAPI, type MeData } from "@/features/profile/api/user.api";
import { MediaAPI } from "@/features/media/api/media.api";
import type { MediaItem } from "@/types/media";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 12;
const TILE_SIZE = (SCREEN_WIDTH - 16 * 2 - GAP) / 2;

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getJoinedYear(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).getFullYear();
  } catch {
    return "";
  }
}

function isVideoType(t: MediaItem["type"]) {
  return t === "VIDEO" || t === "video";
}

export default function ProfileScreen() {
  const [me, setMe] = useState<MeData | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // viewer modal
  const [viewerItem, setViewerItem] = useState<MediaItem | null>(null);

  // ✅ 3-dots ActionSheet states
  const [menuItem, setMenuItem] = useState<MediaItem | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // ✅ Edit modal states
  const [editVisible, setEditVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // support silent refresh
  async function loadProfile(options?: { showLoader?: boolean }) {
    const showLoader = options?.showLoader ?? true;

    try {
      if (showLoader) setLoading(true);
      setError(null);

      const res = await UserAPI.getMe();
      const userData = res.data?.data;

      setMe(userData);
      setMedia(userData?.media || []);
    } catch (err: any) {
      console.log("❌ Profile error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Failed to load profile");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile({ showLoader: false });
    setRefreshing(false);
  }, []);

  // ✅ open 3-dots menu
  const openMenu = useCallback((item: MediaItem) => {
    setMenuItem(item);
    setMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  // ✅ open edit modal
  const openEdit = useCallback(() => {
    if (!menuItem) return;
    setEditTitle(menuItem.title || "");
    setEditDescription(menuItem.description || "");
    setEditVisible(true);
    setMenuVisible(false);
  }, [menuItem]);

  const closeEdit = useCallback(() => {
    setEditVisible(false);
  }, []);

  // ✅ call PATCH /media/:id
  const saveEdit = useCallback(async () => {
    if (!menuItem) return;

    try {
      setActionLoading(true);
      const payload = {
        title: editTitle.trim() || null,
        description: editDescription.trim() || null,
      };

      await MediaAPI.updateMedia(menuItem.id, payload);

      // update local state
      setMedia((prev) =>
        prev.map((m) =>
          m.id === menuItem.id
            ? { ...m, title: payload.title, description: payload.description }
            : m
        )
      );

      // if viewer open on same item update it too
      setViewerItem((prev) =>
        prev?.id === menuItem.id
          ? { ...prev, title: payload.title, description: payload.description }
          : prev
      );

      setEditVisible(false);
    } catch (err: any) {
      console.log("❌ Edit error:", err?.response?.data || err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to update media");
    } finally {
      setActionLoading(false);
    }
  }, [menuItem, editTitle, editDescription]);

  // ✅ call DELETE /media/:id
  const confirmDelete = useCallback(() => {
    if (!menuItem) return;

    Alert.alert(
      "Delete media?",
      "Are you sure you want to delete this media?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteMedia },
      ]
    );
  }, [menuItem]);

  const deleteMedia = useCallback(async () => {
    if (!menuItem) return;

    try {
      setActionLoading(true);
      await MediaAPI.deleteMedia(menuItem.id);

      // remove locally
      setMedia((prev) => prev.filter((m) => m.id !== menuItem.id));

      // update me.mediaCount
      setMe((prev) =>
        prev
          ? { ...prev, mediaCount: Math.max(0, prev.mediaCount - 1) }
          : prev
      );

      // close viewer if open on same item
      setViewerItem((prev) => (prev?.id === menuItem.id ? null : prev));

      setMenuVisible(false);
      setMenuItem(null);
    } catch (err: any) {
      console.log("❌ Delete error:", err?.response?.data || err);
      Alert.alert("Error", err?.response?.data?.message || "Failed to delete media");
    } finally {
      setActionLoading(false);
    }
  }, [menuItem]);

  const header = useMemo(() => {
    if (!me) return null;

    const initials = getInitials(me.name);
    const joinedYear = getJoinedYear(me.createdAt);

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 18,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 3,
            borderWidth: 1,
            borderColor: "#f1f1f4",
          }}
        >
          {/* Avatar */}
          <View style={{ alignItems: "center" }}>
            {me.avatarUrl ? (
              <Image
                source={{ uri: me.avatarUrl }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  marginBottom: 8,
                }}
              />
            ) : (
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: "#ede9fe",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: "#6d28d9",
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
              {me.name}
            </Text>

            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              Joined {joinedYear}
            </Text>
          </View>

          {/* Stats */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 16,
              backgroundColor: "#f7f7fb",
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#ececf3",
            }}
          >
            <StatBox label="Uploads" value={me.mediaCount} />
            <Divider />
            <StatBox label="Likes received" value={me.totalLikesReceived} />
            <Divider />
            <StatBox label="Likes given" value={me.totalLikesGiven} />
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          onPress={() => router.push("/profile/edit")}
          style={{
            marginTop: 18,
            alignSelf: "center",
            backgroundColor: "#ad2bee",
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 999,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Edit Profile
          </Text>
        </TouchableOpacity>

        {/* Section title */}
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>
            Your uploads{" "}
            <Text style={{ color: "#6b7280", fontWeight: "600" }}>
              ({media.length})
            </Text>
          </Text>
        </View>
      </View>
    );
  }, [me, media.length]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f7f6f8",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#ad2bee" />
      </View>
    );
  }

  if (error || !me) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f7f6f8",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "#ef4444", fontSize: 14, marginBottom: 8 }}>
          {error || "Something went wrong"}
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/profile/edit")}
          style={{
            marginTop: 10,
            alignSelf: "center",
            backgroundColor: "#ad2bee",
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f6f8" }}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={media}
        numColumns={2}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 80 }}
        columnWrapperStyle={{ paddingHorizontal: 16, gap: GAP }}
        renderItem={({ item }) => (
          <MediaTile
            item={item}
            onPress={() => setViewerItem(item)}
            onOpenMenu={() => openMenu(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ad2bee"
          />
        }
        ListEmptyComponent={
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              marginTop: 10,
              borderWidth: 1,
              borderColor: "#f1f1f4",
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                color: "#111827",
                marginBottom: 4,
              }}
            >
              No uploads yet
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 12 }}>
              Upload your first photo or video ✨
            </Text>
          </View>
        }
      />

      {/* ✅ Action Sheet Modal (3 dots menu) */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable
          onPress={closeMenu}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "white",
              padding: 16,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
            }}
          >
            <Text style={{ fontWeight: "800", fontSize: 16, marginBottom: 10 }}>
              Media actions
            </Text>

            <ActionButton label="Edit title & description" onPress={openEdit} />
            <ActionButton
              label="Delete media"
              onPress={confirmDelete}
              destructive
            />
            <ActionButton label="Cancel" onPress={closeMenu} muted />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ✅ Edit Modal */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <Pressable
          onPress={closeEdit}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 16 }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", marginBottom: 12 }}>
              Edit media
            </Text>

            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
              Title
            </Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Enter title..."
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 12,
                fontSize: 14,
              }}
            />

            <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
              Description
            </Text>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Enter description..."
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#eee",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 90,
                fontSize: 14,
                textAlignVertical: "top",
              }}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 12,
              }}
            >
              <TouchableOpacity
                onPress={closeEdit}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#f3f4f6",
                  alignItems: "center",
                }}
                disabled={actionLoading}
              >
                <Text style={{ fontWeight: "800", color: "#111827" }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEdit}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#ad2bee",
                  alignItems: "center",
                }}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ fontWeight: "800", color: "white" }}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Viewer Modal */}
      <Modal
        visible={!!viewerItem}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerItem(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)" }}>
          <Pressable
            onPress={() => setViewerItem(null)}
            style={{
              position: "absolute",
              top: 50,
              left: 16,
              zIndex: 10,
              backgroundColor: "rgba(255,255,255,0.12)",
              width: 40,
              height: 40,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 22 }}>✕</Text>
          </Pressable>

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              paddingHorizontal: 12,
            }}
          >
            {viewerItem && isVideoType(viewerItem.type) ? (
              <Video
                source={{ uri: viewerItem.url }}
                style={{
                  width: "100%",
                  height: SCREEN_WIDTH,
                  backgroundColor: "#000",
                  borderRadius: 14,
                }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
                isLooping
              />
            ) : viewerItem ? (
              <Image
                source={{ uri: viewerItem.thumbnailUrl || viewerItem.url }}
                style={{
                  width: "100%",
                  height: SCREEN_WIDTH,
                  borderRadius: 14,
                }}
                resizeMode="contain"
              />
            ) : null}

            {viewerItem && (
              <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
                {!!viewerItem.title && (
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                    {viewerItem.title}
                  </Text>
                )}
                {!!viewerItem.description && (
                  <Text style={{ color: "#d1d5db", marginTop: 4 }}>
                    {viewerItem.description}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* small loading overlay for delete */}
      <Modal visible={actionLoading && menuVisible} transparent animationType="none">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </Modal>
    </View>
  );
}

// -------- small components --------

function ActionButton({
  label,
  onPress,
  destructive,
  muted,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  muted?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: muted ? "#f3f4f6" : "#fafafa",
        borderWidth: 1,
        borderColor: "#eee",
        alignItems: "center",
      }}
      activeOpacity={0.85}
    >
      <Text
        style={{
          fontWeight: "800",
          color: destructive ? "#ef4444" : "#111827",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 12 }}>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ width: 1, backgroundColor: "#e5e7eb" }} />;
}

function MediaTile({
  item,
  onPress,
  onOpenMenu,
}: {
  item: MediaItem;
  onPress: () => void;
  onOpenMenu: () => void;
}) {
  const video = isVideoType(item.type);
  const uri = item.thumbnailUrl || item.url;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#e5e7eb",
        marginBottom: GAP,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      {/* ✅ 3 dots button */}
      <TouchableOpacity
        onPress={onOpenMenu}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: "rgba(0,0,0,0.45)",
          width: 28,
          height: 28,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
          ⋯
        </Text>
      </TouchableOpacity>

      {video && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "rgba(255,255,255,0.9)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>▶</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

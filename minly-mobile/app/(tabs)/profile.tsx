import { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Video, ResizeMode } from "expo-av";
import { router } from "expo-router";

const API_URL = "http://192.168.1.7:4000/v1";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 12;
const TILE_SIZE = (SCREEN_WIDTH - 16 * 2 - GAP) / 2;

type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO" | "image" | "video";
  title: string | null;
  description: string | null;
  likesCount: number;
  createdAt: string;
};

type MeResponse = {
  id: string;
  name: string;
  avatarUrl: string | null;
  mediaCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
  createdAt: string;
  media: MediaItem[];
};

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
  const [me, setMe] = useState<MeResponse | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // viewer modal
  const [viewerItem, setViewerItem] = useState<MediaItem | null>(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("token");
      console.log("🔍 TOKEN (profile):", token);

      const res = await axios.get(`${API_URL}/user/me`, {
        headers: {
          Authorization: token || "", // نفس Postman عندك
          // لو غيرت الباك لـ Bearer استخدم:
          // Authorization: `Bearer ${token}`
        },
      });

      const userData: MeResponse = res.data?.data;
      console.log("✅ /user/me response:", userData);

      setMe(userData);
      setMedia(userData?.media || []);
    } catch (err: any) {
      console.log("❌ Profile error:", err?.response?.data || err);
      setError(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

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
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#6d28d9" }}>
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
          <Text style={{ color: "white", fontWeight: "700" }}>Edit Profile</Text>
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
      <View style={{ flex: 1, backgroundColor: "#f7f6f8", justifyContent: "center" }}>
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
  <Text style={{ color: "white", fontWeight: "700" }}>Edit Profile</Text>
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
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        columnWrapperStyle={{
          paddingHorizontal: 16,
          gap: GAP,
        }}
        renderItem={({ item }) => (
          <MediaTile item={item} onPress={() => setViewerItem(item)} />
        )}
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
            <Text style={{ fontWeight: "800", color: "#111827", marginBottom: 4 }}>
              No uploads yet
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 12 }}>
              Upload your first photo or video ✨
            </Text>
          </View>
        }
      />

      {/* Viewer Modal */}
      <Modal
        visible={!!viewerItem}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerItem(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)" }}>
          {/* close */}
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

            {/* meta */}
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
    </View>
  );
}

// -------- small components --------

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

function MediaTile({ item, onPress }: { item: MediaItem; onPress: () => void }) {
  const video = isVideoType(item.type);
  const uri = item.thumbnailUrl || item.url;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
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

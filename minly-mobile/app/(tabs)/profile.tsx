import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StatusBar,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const API_URL = "http://192.168.1.7:4000/v1";
const { width } = Dimensions.get("window");
const CARD_RADIUS = 18;
const GAP = 10;
const COLS = 2;
const ITEM_W = (width - 16 * 2 - GAP) / COLS; // paddingHorizontal 16
const ITEM_H = ITEM_W * 1.1;

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
  status: "success";
  data: {
    id: string;
    name: string;
    email?: string;
    avatarUrl: string | null;
    mediaCount: number;
    totalLikesReceived: number;
    totalLikesGiven: number;
    createdAt: string;
    media: MediaItem[];
  };
};

function formatLikes(n: number) {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

function getYear(dateStr: string) {
  const d = new Date(dateStr);
  return d.getFullYear();
}

function isVideoType(t: string) {
  return t === "VIDEO" || t === "video";
}

// ============================
// Media Tile (Grid Item)
// ============================
function MediaTile({ item }: { item: MediaItem }) {
  const isVideo = isVideoType(item.type);
  const preview = item.thumbnailUrl || item.url;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        // لو عندك صفحة تفاصيل بعدين غيّر المسار ده
        // router.push(`/media/${item.id}`);
      }}
      style={{
        width: ITEM_W,
        height: ITEM_H,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#eee",
        position: "relative",
      }}
    >
      {/* Preview Image */}
      <Image
        source={{ uri: preview }}
        resizeMode="cover"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Video overlay */}
      {isVideo && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.9)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 18 }}>▶</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ============================
// Profile Screen
// ============================
export default function ProfileScreen() {
  const [user, setUser] = useState<MeResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarUrl = useMemo(() => {
    if (!user) return null;
    return (
      user.avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
    );
  }, [user]);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        setUser(null);
        setError("No token found. Please login again.");
        return;
      }

      const res = await axios.get<MeResponse>(`${API_URL}/user/me`, {
        headers: { Authorization: token }, // نفس Postman عندك
        // لو الباك عندك Bearer:
        // headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f7f6f8" }}>
        <StatusBar barStyle="dark-content" />
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#ad2bee" />
          <Text style={{ marginTop: 10, color: "#777" }}>Loading profile…</Text>
        </View>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f7f6f8",
          paddingTop: 60,
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ color: "#666", textAlign: "center", marginBottom: 14 }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadProfile}
          style={{
            backgroundColor: "#ad2bee",
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Try again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          style={{ marginTop: 10 }}
        >
          <Text style={{ color: "#2459ff", fontWeight: "600" }}>
            Go to login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const media = user.media || [];

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f6f8" }}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={media}
        numColumns={COLS}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 90,
          gap: GAP,
        }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            {/* Profile Card */}
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: CARD_RADIUS,
                padding: 16,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 3,
              }}
            >
              {/* Avatar + Name */}
              <View
                style={{
                  alignItems: "center",
                  gap: 6,
                  paddingTop: 4,
                }}
              >
                <Image
                  source={{ uri: avatarUrl! }}
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 999,
                    backgroundColor: "#eee",
                    borderWidth: 3,
                    borderColor: "#ad2bee1a",
                  }}
                />

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#161118",
                    marginTop: 4,
                    textTransform: "capitalize",
                  }}
                >
                  {user.name}
                </Text>

                {!!user.email && (
                  <Text style={{ fontSize: 12, color: "#7c7c8a" }}>
                    {user.email}
                  </Text>
                )}

                <Text style={{ fontSize: 12, color: "#7c7c8a" }}>
                  Joined {getYear(user.createdAt)}
                </Text>
              </View>

              {/* Stats */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#f7f6f8",
                  borderRadius: 14,
                  marginTop: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                }}
              >
                <StatBox label="Uploads" value={user.mediaCount} />
                <Divider />
                <StatBox label="Likes received" value={formatLikes(user.totalLikesReceived)} />
                <Divider />
                <StatBox label="Likes given" value={formatLikes(user.totalLikesGiven)} />
              </View>
            </View>

            {/* Section title */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#161118",
                }}
              >
                Your uploads
              </Text>
              <Text style={{ fontSize: 13, color: "#7c7c8a" }}>
                ({media.length})
              </Text>
            </View>

            {/* Empty State */}
            {media.length === 0 && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  gap: 10,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    backgroundColor: "#ad2bee14",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>📸</Text>
                </View>
                <Text style={{ fontWeight: "800", color: "#161118" }}>
                  No media yet
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#7c7c8a",
                    textAlign: "center",
                    maxWidth: 220,
                  }}
                >
                  Upload your first photo or video and it will show here.
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/upload")}
                  style={{
                    marginTop: 4,
                    backgroundColor: "#ad2bee",
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    Upload now
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <MediaTile item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ============================
// Small UI parts
// ============================
function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: 16, fontWeight: "800", color: "#161118" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: "#7c7c8a" }}>{label}</Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        width: 1,
        backgroundColor: "#e8e6ee",
        marginVertical: 4,
      }}
    />
  );
}

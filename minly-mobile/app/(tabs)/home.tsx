import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { red } from "react-native-reanimated/lib/typescript/Colors";

const API_URL = "http://192.168.1.7:4000/v1";
const screenWidth = Dimensions.get("window").width;

// =====================
// Helpers
// =====================
function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);

  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function formatLikes(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

// =====================
// Media Card
// =====================
function MediaCard({ item, onToggleLike }: any) {
  const isVideo = item.type === "VIDEO" || item.type === "video";
  const imageUrl = item.thumbnailUrl || item.url;

  const avatarUrl =
    item.uploader?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      item.uploader?.name || "User"
    )}`;

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        marginBottom: 18,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          gap: 10,
        }}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 40, height: 40, borderRadius: 999 }}
        />

        <View>
          <Text style={{ fontWeight: "bold", fontSize: 20 }}>
            {item.uploader?.name}
          </Text>
          <Text style={{ fontSize: 12, color: "#7c7c8a" }}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Media */}
      {isVideo ? (
        <Video
          source={{ uri: item.url }}
          style={{
            width: "100%",
            height: screenWidth,
            backgroundColor: "#000",
          }}
          resizeMode={ResizeMode.COVER}
          useNativeControls
          isLooping
        />
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: screenWidth,
            backgroundColor: "#ddd",
          }}
        />
      )}

      {/* Content */}
      <View style={{ padding: 14 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4, color:"red"}}>
          {item.title || "Untitled media"}
        </Text>

        {!!item.description && (
          <Text style={{ color: "#7a7a8a", marginBottom: 8 }}>
            {item.description}
          </Text>
        )}

        {/* Likes */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity onPress={() => onToggleLike(item)}>
            <Text
              style={{
                fontSize: 22,
                color: item.isLikedByCurrentUser ? "#e11d48" : "#7c7c8a",
              }}
            >
              {item.isLikedByCurrentUser ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontWeight: "600", color: "#7c7c8a" }}>
            {formatLikes(item.likesCount)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// =====================
// Screen
// =====================
export default function FeedScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/media`, {
        params: { page: 1, limit: 20 },
      });

      const data = res.data?.data || [];
      setItems(data);
    } catch (err: any) {
      console.log("❌ Feed error:", err?.message);
      console.log("❌ Feed error data:", err?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function toggleLike(item: any) {
    // optimistic
    setItems((prev) =>
      prev.map((x) =>
        x.id === item.id
          ? {
              ...x,
              isLikedByCurrentUser: !x.isLikedByCurrentUser,
              likesCount: x.likesCount + (x.isLikedByCurrentUser ? -1 : 1),
            }
          : x
      )
    );

    try {
      const token = await SecureStore.getItemAsync("token");
      console.log("🔍 TOKEN:", token);

      const res = await axios.post(
        `${API_URL}/like/${item.id}`,
        {},
        {
          headers: {
            Authorization: token || "", // نفس Postman
            // لو backend عايز Bearer:
            // Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Like response:", res.data);
    } catch (err: any) {
      console.log("❌ Like error status:", err?.response?.status);
      console.log("❌ Like error data:", err?.response?.data || err);

      // rollback
      loadFeed();
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f7f6f8", paddingTop: 40 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 20,
            paddingHorizontal: 16,
            color: "#161118",
          }}
        >
          Global Feed
        </Text>

        <ActivityIndicator
          size="large"
          color="#ad2bee"
          style={{ marginTop: 40 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f6f8", paddingTop: 40 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 20,
          paddingHorizontal: 16,
          color: "#161118",
        }}
      >
        Global Feed
      </Text>

      <FlatList
        data={items}
        renderItem={({ item }) => (
          <MediaCard item={item} onToggleLike={toggleLike} />
        )}
        keyExtractor={(x) => x.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFeed();
            }}
          />
        }
      />
    </View>
  );
}

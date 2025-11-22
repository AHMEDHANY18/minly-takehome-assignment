import React, { useEffect, useState, useCallback } from "react";
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
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import { MediaAPI } from "../../api/media.api";
import type { MediaItem } from "../../types/media";
import { AxiosError } from "axios";

const screenWidth = Dimensions.get("window").width;

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

const MediaCard = React.memo(function MediaCard({
  item,
  onToggleLike,
}: {
  item: MediaItem;
  onToggleLike: (item: MediaItem) => void;
}) {
  const isVideo = item.type === "VIDEO" || item.type === "video";
  const imageUrl = item.thumbnailUrl || item.url;

  const avatarUrl =
    item.uploader?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      item.uploader?.name || "User"
    )}`;

  const goToProfile = useCallback(() => {
    const userId = item.uploader?.id;
    if (!userId) return;
    router.push(`/profile/${userId}`);
  }, [item.uploader?.id]);

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
      <TouchableOpacity
        onPress={goToProfile}
        activeOpacity={0.8}
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
      </TouchableOpacity>

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

      <View style={{ padding: 14 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>
          {item.title || "Untitled media"}
        </Text>

        {!!item.description && (
          <Text style={{ color: "#7a7a8a", marginBottom: 8 }}>
            {item.description}
          </Text>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TouchableOpacity onPress={() => onToggleLike(item)}>
            <Text
              style={{
                fontSize: 22,
                color: item.isLikedByCurrentUser ? "#e11d48" : "#7c7c8a",
              }}
            >
              {item.isLikedByCurrentUser ? "❤️" : "♡"}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontWeight: "600", color: "#7c7c8a" }}>
            {formatLikes(item.likesCount)}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default function FeedScreen() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const res = await MediaAPI.getFeed(1, 50);
      const data = res.data?.data || res.data?.items || [];
      setItems(data);
    } catch (err: any) {
      console.log("Feed error:", err?.message, err?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onToggleLike = useCallback(
    async (item: MediaItem) => {
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
        await MediaAPI.toggleLike(item.id);
      } catch (err) {
        const error = err as AxiosError;
        console.log("Like error:", error.response?.data || error.message);
        loadFeed();
      }

    },
    [loadFeed]
  );

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <MediaCard item={item} onToggleLike={onToggleLike} />
    ),
    [onToggleLike]
  );

  const keyExtractor = useCallback((x: MediaItem) => x.id, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f7f6f8", paddingTop: 40 }}>
        <MaskedView
          maskElement={
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                paddingHorizontal: 16,
                marginBottom: 20,
              }}
            >
              Global Feed
            </Text>
          }
        >
          <LinearGradient
            colors={["#9b5cff", "#d471ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                paddingHorizontal: 16,
                marginBottom: 20,
                opacity: 0,
              }}
            >
              Global Feed
            </Text>
          </LinearGradient>
        </MaskedView>

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
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <MaskedView
          maskElement={
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
              }}
            >
              Global Feed
            </Text>
          }
        >
          <LinearGradient
            colors={["#9b5cff", "#d471ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                opacity: 0,
              }}
            >
              Global Feed
            </Text>
          </LinearGradient>
        </MaskedView>

        <LinearGradient
          colors={["#9b5cff", "#d471ff", "#ff7ad9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 4,
            borderRadius: 999,
            marginTop: 6,
            width: 140,
            opacity: 0.9,
          }}
        />
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFeed();
            }}
            tintColor="#ad2bee"
          />
        }
        removeClippedSubviews
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
    </View>
  );
}

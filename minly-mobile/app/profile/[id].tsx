import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { UserAPI } from "../../api/user.api";
import type { MediaItem } from "../../types/media";
import type { MeData } from "../../api/user.api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 12;
const TILE_SIZE = (SCREEN_WIDTH - 16 * 2 - GAP) / 2;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<MeData | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerItem, setViewerItem] = useState<MediaItem | null>(null);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      const res = await UserAPI.getById(String(id));
      const payload = res.data.data;
      setUser(payload);
      setMedia(payload.media ?? []);
    } catch (err: any) {
      console.log("user profile error:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#f7f6f8" }}>
        <ActivityIndicator size="large" color="#ad2bee" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>User not found</Text>
      </View>
    );
  }

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "--";

  const header = (
    <View style={{ padding: 16 }}>
      <View
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 20,
          alignItems: "center",
        }}
      >
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={{ width: 90, height: 90, borderRadius: 45 }}
          />
        ) : (
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: "#e3d5ff",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#6d28d9" }}>
              {initials}
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 20, fontWeight: "800", marginTop: 10 }}>
          {user.name}
        </Text>

        <Text style={{ color: "#6b7280", fontSize: 12 }}>
          Joined {user.createdAt ? new Date(user.createdAt).getFullYear() : "-"}
        </Text>

        <View
          style={{
            flexDirection: "row",
            marginTop: 16,
            backgroundColor: "#f7f7fb",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <Stat label="Uploads" value={user.mediaCount} />
          <Stat label="Likes received" value={user.totalLikesReceived} />
          <Stat label="Likes given" value={user.totalLikesGiven} />
        </View>
      </View>

      <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "700" }}>
        {user.name ? user.name.split(" ")[0] : "User"}'s uploads ({media.length})
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f6f8" }}>
      <FlatList
        data={media}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: 16 }}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <MediaTile item={item} onPress={() => setViewerItem(item)} />
        )}
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={5}
      />

      <Modal visible={!!viewerItem} transparent animationType="fade">
        <Pressable
          onPress={() => setViewerItem(null)}
          style={{
            position: "absolute",
            top: 40,
            left: 20,
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.15)",
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 24 }}>←</Text>
        </Pressable>

        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center" }}>
          {viewerItem?.type?.toUpperCase() === "VIDEO" ? (
            <Video
              source={{ uri: viewerItem.url }}
              style={{ width: "100%", height: SCREEN_WIDTH }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
            />
          ) : (
            <Image
              source={{ uri: viewerItem?.url }}
              style={{ width: "100%", height: SCREEN_WIDTH }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
      <Text style={{ fontSize: 16, fontWeight: "900" }}>{value}</Text>
      <Text style={{ fontSize: 11, color: "#6b7280" }}>{label}</Text>
    </View>
  );
}

function MediaTile({ item, onPress }: { item: MediaItem; onPress: () => void }) {
  const isVideo = item.type?.toUpperCase() === "VIDEO";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#ddd",
        marginBottom: GAP,
      }}
    >
      <Image source={{ uri: item.thumbnailUrl || item.url }} style={{ width: "100%", height: "100%" }} />

      {isVideo && (
        <View
          style={{
            position: "absolute",
            inset: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.2)",
          }}
        >
          <Text style={{ fontSize: 32, color: "white" }}>▶</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavedMedia } from "../api/bookmarks";

export function SavedGridCard({ item }: { item: SavedMedia }) {
  return (
    <Pressable style={styles.card}>
      <Image
        source={{ uri: item.thumbnailUrl || item.url }}
        style={styles.image}
      />

      {item.type === "VIDEO" && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={12} color="#fff" />
        </View>
      )}

      {item.title && (
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#eee",
  },
  videoBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 4,
  },
  title: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
  },
});

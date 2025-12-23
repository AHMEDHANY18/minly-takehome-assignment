import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MediaAPI } from "@/features/media/api/media.api";

type Props = {
  item: {
    id: string;
    url: string;
    title?: string | null;
    description?: string | null;
  };
  size: number;
  onPress?: () => void;
  onDeleted?: (id: string) => void;
  onEdited?: () => void;
};

export function ProfileMediaCard({ item, size, onPress, onDeleted, onEdited }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function confirmDelete() {
    Alert.alert("Delete media", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setBusy(true);
            await MediaAPI.remove(item.id);
            onDeleted?.(item.id);
          } catch {
            Alert.alert("Error", "Failed to delete media");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={{ width: size, marginBottom: 12 }}>
      <Pressable onPress={onPress} disabled={busy}>
        <Image source={{ uri: item.url }} style={[styles.image, { width: size, height: size }]} />
      </Pressable>

      {/* ⋯ menu button */}
      <Pressable
        style={styles.menuBtn}
        onPress={() => setMenuOpen((v) => !v)}
        disabled={busy}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
      </Pressable>

      {/* menu */}
      {menuOpen && (
        <View style={styles.menu}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              onEdited?.();
            }}
          >
            <Ionicons name="create-outline" size={16} />
            <Text style={styles.menuText}>Edit</Text>
          </Pressable>

          <Pressable
            style={[styles.menuItem, { borderTopWidth: 1 }]}
            onPress={() => {
              setMenuOpen(false);
              confirmDelete();
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#D92D20" />
            <Text style={[styles.menuText, { color: "#D92D20" }]}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 12,
    backgroundColor: "#eee",
  },

  menuBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    padding: 6,
  },

  menu: {
    position: "absolute",
    top: 36,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 140,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: "#EAECF0",
  },

  menuText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
});

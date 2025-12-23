import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FeedMode } from "@/features/feed/api/feed.api";

export function SegmentedTabs({
  value,
  onChange,
}: {
  value: FeedMode;
  onChange: (v: FeedMode) => void;
}) {
  return (
    <View style={styles.wrap}>
      <Tab label="Home" active={value === "home"} onPress={() => onChange("home")} />
      <Tab
        label="Explore"
        active={value === "explore"}
        onPress={() => onChange("explore")}
      />
      <Tab
        label="Trending"
        active={value === "trending"}
        onPress={() => onChange("trending")}
      />
    </View>
  );
}

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.txt, active && styles.txtActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#F3F4F7",
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: "#E8E9EF",
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E7ED",
  },
  txt: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  txtActive: { color: "#111" },
});

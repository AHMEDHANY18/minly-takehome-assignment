import React from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSavedItems } from "../hooks/useSavedItems";
import { SavedGridCard } from "../components/SavedGridCard";

const FILTERS = [
  { label: "All", value: undefined },
  { label: "Images", value: "image" },
  { label: "Videos", value: "video" },
] as const;

export default function SavedScreen() {
  const {
    items,
    loadMore,
    refresh,
    refreshing,
    setType,
    type,
  } = useSavedItems();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={22} />
        <Text style={styles.headerTitle}>Saved</Text>
        <Ionicons name="person-circle-outline" size={26} />
      </View>

      <Text style={styles.subtitle}>Your personal collection</Text>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#888" />
        <TextInput
          placeholder="Search saved items..."
          style={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const active = type === f.value;
          return (
            <Pressable
              key={f.label}
              onPress={() => setType(f.value)}
              style={[styles.filterBtn, active && styles.filterActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.count}>{items.length} Items</Text>

      {/* Grid */}
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SavedGridCard item={item} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshing={refreshing}
        onRefresh={refresh}
        ListFooterComponent={
          <Text style={styles.footer}>End of saved items</Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#777", marginVertical: 6 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
    marginVertical: 10,
  },
  searchInput: { marginLeft: 6, flex: 1 },

  filters: { flexDirection: "row", marginBottom: 10 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f1f1",
    marginRight: 8,
  },
  filterActive: { backgroundColor: "#000" },
  filterText: { fontSize: 13 },
  filterTextActive: { color: "#fff" },

  count: { color: "#777", marginBottom: 8 },
  footer: {
    textAlign: "center",
    paddingVertical: 20,
    color: "#999",
    fontSize: 12,
  },
});

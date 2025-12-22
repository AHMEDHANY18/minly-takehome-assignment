import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSuggestedUsers } from "../../hooks/useSuggestedUsers";

export function SuggestedUsers() {
  const { items, loading, toggleFollow } = useSuggestedUsers(10);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggested for you</Text>
        <Pressable hitSlop={10}>
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 14 }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 6 }}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          renderItem={({ item }) => {
            const avatar = (item as any)?.avatarUrl;
            const label =
              (item as any)?.isFollowing ? "Follow Back" : "Follow";
            const filled = !(item as any)?.isFollowing;

            return (
              <View style={styles.userCard}>
                <View style={styles.avatarWrap}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: "#E9EAF0" }]} />
                  )}
                </View>

                <Text numberOfLines={1} style={styles.name}>
                  {item.name ?? "User"}
                </Text>

                <Text style={styles.sub}>
                  {(item as any)?.isFollowing ? "Follows you" : "New to Minly"}
                </Text>

                <Pressable
                  onPress={() => toggleFollow(item.id)}
                  style={[styles.btn, filled ? styles.btnFilled : styles.btnOutline]}
                >
                  <Text style={[styles.btnTxt, filled ? styles.btnTxtFilled : styles.btnTxtOutline]}>
                    {label}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  title: { fontSize: 12, fontWeight: "900", color: "#111" },
  seeAll: { fontSize: 12, fontWeight: "800", color: "#2F80ED" },

  userCard: {
    width: 110,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFEFF3",
  },

  avatarWrap: { width: 46, height: 46, borderRadius: 23, overflow: "hidden" },
  avatar: { width: 46, height: 46, borderRadius: 23 },

  name: { marginTop: 8, fontSize: 12, fontWeight: "900", color: "#111" },
  sub: { marginTop: 2, fontSize: 11, color: "#6B7280" },

  btn: {
    marginTop: 8,
    width: "100%",
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  btnFilled: { backgroundColor: "#2F80ED" },
  btnOutline: { borderWidth: 1, borderColor: "#2F80ED", backgroundColor: "#FFFFFF" },

  btnTxt: { fontSize: 12, fontWeight: "900" },
  btnTxtFilled: { color: "#FFFFFF" },
  btnTxtOutline: { color: "#2F80ED" },
});

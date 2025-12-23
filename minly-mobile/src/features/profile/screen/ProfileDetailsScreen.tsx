import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function ProfileDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Profile" }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.title}>User Profile</Text>
          <Text style={styles.sub}>id: {String(id)}</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFC" },
  card: {
    margin: 12,
    padding: 14,
    backgroundColor: "#FFF",
    borderRadius: 16,
  },
  title: { fontWeight: "900", fontSize: 16, color: "#111" },
  sub: { marginTop: 6, color: "#777" },
});

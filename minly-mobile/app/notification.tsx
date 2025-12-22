import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

export default function NotificationScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>Coming soon</Text>
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

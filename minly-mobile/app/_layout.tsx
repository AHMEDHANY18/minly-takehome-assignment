// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name="story/[userId]"
        options={{ presentation: "fullScreenModal", animation: "fade" }}
      />
    </Stack>
  );
}

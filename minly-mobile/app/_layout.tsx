// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* شاشة index هي اللي هتقرر تودّي المستخدم فين (auth ولا tabs) */}
      <Stack.Screen name="index" />

      {/* جروب التابات */}
      <Stack.Screen name="(tabs)" />

      {/* جروب الأوث (login + register) */}
      <Stack.Screen name="auth" />

      {/* لو عندك مودال */}
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal" }}
      />
    </Stack>
  );
}

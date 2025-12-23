// app/_layout.tsx
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { setOnUnauthorized } from "@/api/authEvents";
import { useAuthStore } from "@/store/auth.store";

export default function RootLayout() {
  useEffect(() => {
    setOnUnauthorized(() => {
      // امسح التوكن وارجع guest
      void useAuthStore.getState().logout();
      // ودّيه للوجين
      router.replace("/auth/login");
    });

    return () => setOnUnauthorized(null);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

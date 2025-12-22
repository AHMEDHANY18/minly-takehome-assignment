import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "../../stores/auth.store";

export default function AuthSuccess() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const setToken = useAuthStore((s) => s.setToken);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (token) await setToken(String(token));
      router.replace("/(tabs)/home");
    })();
  }, [token]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

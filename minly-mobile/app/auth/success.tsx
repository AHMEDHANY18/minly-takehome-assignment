import { useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function AuthSuccess() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  useEffect(() => {
    (async () => {
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      await SecureStore.setItemAsync("token", String(token));
      router.replace("/(tabs)/home");
    })();
  }, [token]);

  return null;
}

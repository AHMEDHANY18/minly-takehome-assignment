// app/index.tsx
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("token").then((t) => {
      setToken(t);
      setReady(true);
    });
  }, []);

  // ممكن تحط Splash حلو هنا لو حابب
  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

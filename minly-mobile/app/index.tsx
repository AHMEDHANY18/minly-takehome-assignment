import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../stores/auth.store";

export default function Index() {
  const router = useRouter();
  const { status, bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (status === "authed") {
      router.replace("/(tabs)/home");
    } else if (status === "guest") {
      router.replace("/auth/login");
    }
  }, [status]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
    </View>
  );
}

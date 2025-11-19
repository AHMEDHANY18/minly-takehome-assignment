import { View, Text, Pressable } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export default function HomeScreen() {
  async function logout() {
    await SecureStore.deleteItemAsync("token");
    router.replace("/auth/login");
  }

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Welcome 🎉</Text>

      <Pressable
        onPress={logout}
        style={{
          backgroundColor: "#ff4f4f",
          padding: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Logout</Text>
      </Pressable>
    </View>
  );
}

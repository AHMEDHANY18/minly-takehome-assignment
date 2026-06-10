import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { API_BASE_URL } from "@/api/client";

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const onCreateAccount = async () => {
    const returnUrl = Linking.createURL("/auth/success");

    // Same backend OAuth start as login; screen_hint=signup asks the Cognito
    // hosted UI to open on the sign-up form (harmless if ignored — the hosted
    // UI also has a built-in "Sign up" link).
    const startUrl =
      `${API_BASE_URL}/auth/login` +
      `?app_redirect=${encodeURIComponent(returnUrl)}` +
      `&screen_hint=signup`;

    const result = await WebBrowser.openAuthSessionAsync(
      startUrl,
      returnUrl
    );
    if (result.type !== "success" || !result.url) return;
    router.replace("/auth/success");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.logo}>Minly</Text>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          Sign up to start sharing photos and videos
        </Text>

        <Pressable style={styles.googleBtn} onPress={onCreateAccount}>
          <Text style={styles.googleText}>Sign up with Google</Text>
        </Pressable>

        <Pressable
          hitSlop={8}
          onPress={() => router.replace("/auth/login")}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Text style={styles.switchLink}>Log in</Text>
          </Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f7f5ff",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 6,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: "#6b7280",
    textAlign: "center",
  },
  googleBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  googleText: {
    fontWeight: "600",
  },
  switchRow: {
    marginTop: 16,
  },
  switchText: {
    fontSize: 12,
    color: "#6b7280",
  },
  switchLink: {
    color: "#2D7CFF",
    fontWeight: "700",
  },
  terms: {
    marginTop: 16,
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});

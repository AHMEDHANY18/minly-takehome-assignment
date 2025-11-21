import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const API_URL = "http://192.168.1.9:4000/v1"; // عدّلها لو لازم

export default function LoginScreen() {
  // لو جاي من register ومعاه email
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = params?.email ? String(params.email) : "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  async function handleLogin() {
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("▶️ Checking email...", email);

      // 1) شيك الأول هل الإيميل موجود
      const checkRes = await axios.post(`${API_URL}/auth/check-email`, { email });
      const checkData: any = checkRes.data;
      const exists: boolean =
        checkData?.exists ?? checkData?.result ?? !!checkData;

      if (!exists) {
        // لو الإيميل مش موجود → روح على register ومعاك الإيميل
        console.log("📩 Email not found, redirecting to register...");
        router.push({ pathname: "/auth/register", params: { email } });
        return;
      }

      console.log("✅ Email exists, continue login...");

      // 2) لو الإيميل موجود → Login عادي
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      console.log("✅ Login Response:", res.data);

      const token = res.data?.token ?? res.data?.data?.token;
      const user = res.data?.user ?? res.data?.data?.user;

      if (!token) {
        throw new Error("Token missing in server response");
      }

      await SecureStore.setItemAsync("token", token);
      console.log("💾 Token saved:", token);
      console.log("👤 User:", user);

      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("❌ Login error:", err);
      setError(
        err?.response?.data?.message ||
          "Incorrect email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f7f5ff",
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 28,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        }}
      >
        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: "600",
            textAlign: "center",
            marginBottom: 28,
            color: "#0f172a",
          }}
        >
          Minly
        </Text>

        {/* Email */}
        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 6,
            }}
          >
            Email
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              fontSize: 14,
              color: "#0f172a",
            }}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 6,
            }}
          >
            Password
          </Text>

          <View
            style={{
              position: "relative",
              justifyContent: "center",
            }}
          >
            <TextInput
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                fontSize: 14,
                color: "#0f172a",
                paddingRight: 44, // مساحة للأيقونة
              }}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            {/* Eye toggle (بسيطة بدون أي مكتبة) */}
            <Pressable
              onPress={() => setShowPassword((p) => !p)}
              style={{
                position: "absolute",
                right: 10,
                height: "100%",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontSize: 16, color: "#9ca3af" }}>
                {showPassword ?  "👁" : "🔒"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Error */}
        {error ? (
          <Text
            style={{
              marginTop: 4,
              marginBottom: 8,
              fontSize: 11,
              color: "#e5533d",
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Login button */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{
            marginTop: 10,
            backgroundColor: "#b845ff",
            borderRadius: 16,
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#7430ff",
            shadowOpacity: 0.45,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 5,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: "white",
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Log in
            </Text>
          )}
        </Pressable>

        {/* Footer */}
        <View style={{ marginTop: 18, alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6b7280" }}>
            Don’t have an account?{" "}
            <Link
              href={{
                pathname: "/auth/register",
                params: { email },
              }}
              style={{ color: "#b845ff", fontWeight: "600" }}
            >
              Create an account
            </Link>
          </Text>
        </View>
      </View>
    </View>
  );
}

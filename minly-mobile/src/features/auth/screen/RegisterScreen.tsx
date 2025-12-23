import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { AuthAPI } from "@/features/auth/api/auth.api";

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = params?.email ? String(params.email) : "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleRegister = useCallback(async () => {
    setError(null);

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await AuthAPI.register({
        name,
        email,
        password,
        confirmPassword,
      });
      const body = res.data;

      let token = body.token ?? body.data?.token;
      let user = body.user ?? body.data?.user;

      if (!token) {
        const loginRes = await AuthAPI.login({ email, password });
        const loginBody = loginRes.data;
        token = loginBody.token ?? loginBody.data?.token;
        user = loginBody.user ?? loginBody.data?.user;
      }

      if (!token) {
        throw new Error("No token returned after register/login.");
      }

      await SecureStore.setItemAsync("token", token);
      console.log("Token saved after register:", token);
      console.log("User:", user);

      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("Register error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to sign up. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword]);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#f7f5ff",
        paddingHorizontal: 24,
        paddingVertical: 32,
        justifyContent: "center",
      }}
      keyboardShouldPersistTaps="handled"
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
        <Text
          style={{
            fontSize: 26,
            fontWeight: "600",
            textAlign: "center",
            marginBottom: 24,
            color: "#0f172a",
          }}
        >
          Minly
        </Text>

        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 6,
            }}
          >
            Full Name
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
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 6,
            }}
          >
            Email Address
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

        <View style={{ marginBottom: 14 }}>
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

          <View style={{ position: "relative" }}>
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
                paddingRight: 44,
              }}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

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
                {showPassword ? "👁" : "👁️‍🗨️"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: "#4b5563",
              marginBottom: 6,
            }}
          >
            Confirm Password
          </Text>

          <View style={{ position: "relative" }}>
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
                paddingRight: 44,
              }}
              placeholder="Confirm your password"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />

            <Pressable
              onPress={() => setShowConfirm((p) => !p)}
              style={{
                position: "absolute",
                right: 10,
                height: "100%",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontSize: 16, color: "#9ca3af" }}>
                {showConfirm ? "👁" : "👁️‍🗨️"}
              </Text>
            </Pressable>
          </View>
        </View>

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

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={{
            marginTop: 10,
            borderRadius: 16,
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#b845ff",
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
              Sign up
            </Text>
          )}
        </Pressable>

        <View style={{ marginTop: 18, alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6b7280" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#2459ff", fontWeight: "600" }}>
              Log in
            </Link>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

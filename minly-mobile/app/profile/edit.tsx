// app/profile/edit.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { api } from "../lib/api"; // عدّل المسار لو حطيته في مكان تاني

type MeResponse = {
  status: "success";
  data: {
    id: string;
    name: string;
    email?: string | null;
    avatarUrl?: string | null;
    createdAt: string;
  };
};

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pickedAvatar, setPickedAvatar] = useState<any>(null);

  async function loadMe() {
    try {
      setLoading(true);
      const res = await api.get<MeResponse>("/user/me");
      const me = res.data.data;
      setName(me.name || "");
      setEmail(me.email || "");
      setAvatarUrl(me.avatarUrl || null);
    } catch (err: any) {
      console.log("❌ loadMe error:", err?.response?.data || err);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access to photos to change avatar.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // الجديد بدل MediaTypeOptions
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!res.canceled) {
      const asset = res.assets[0];
      setPickedAvatar(asset);
      setAvatarUrl(asset.uri);
    }
  }

  async function saveProfile() {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    setSaving(true);

    try {
      const form = new FormData();
      form.append("name", name.trim());
      if (email.trim()) form.append("email", email.trim());

      if (pickedAvatar) {
        const fileName =
          pickedAvatar.fileName ||
          `avatar_${Date.now()}.jpg`;

        const mimeType =
          pickedAvatar.mimeType || "image/jpeg";

        form.append("file", {
          uri: pickedAvatar.uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      // Debug logs
      console.log("📦 UpdateProfile FormData:", form);
      console.log("🖼 pickedAvatar:", pickedAvatar);

      // request
      let res;
      try {
        res = await api.patch("/user", form, {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: (d) => d,
        });
      } catch (e: any) {
        // fallback لو الباك عايز Bearer
        if (e?.response?.status === 401) {
          const token = (await import("expo-secure-store")).default
            ? null
            : null; // dummy to satisfy TS in some env
          // هنجيب التوكين ونجرّب Bearer مرة واحدة
          const realToken = await (await import("expo-secure-store")).getItemAsync("token");
          if (realToken && !realToken.startsWith("Bearer ")) {
            res = await api.patch("/user", form, {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${realToken}`,
              },
              transformRequest: (d) => d,
            });
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }

      console.log("✅ update profile response:", res?.data);

      Alert.alert("Success", "Profile updated!");
      router.back(); // يرجع لصفحة الـ profile
    } catch (err: any) {
      console.log("❌ update profile error:", err?.response?.data || err);
      Alert.alert("Error", err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ad2bee" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#f7f6f8",
        padding: 20,
      }}
    >
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 22 }}>←</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "700" }}>Edit Profile</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Avatar */}
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 18,
          padding: 18,
          alignItems: "center",
          marginBottom: 14,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
          <View style={{ position: "relative" }}>
            <Image
              source={{
                uri:
                  avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name || "User"
                  )}`,
              }}
              style={{
                width: 110,
                height: 110,
                borderRadius: 999,
                backgroundColor: "#eee",
              }}
            />

            <View
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                backgroundColor: "#ad2bee",
                width: 36,
                height: 36,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "white",
              }}
            >
              <Text style={{ color: "white", fontSize: 18 }}>✎</Text>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={{ marginTop: 10, fontSize: 12, color: "#7c7c8a" }}>
          Tap to change avatar
        </Text>
      </View>

      {/* Inputs */}
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 18,
          padding: 16,
          gap: 12,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: "#4b5563", marginBottom: 6 }}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#aaa"
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 12, color: "#4b5563", marginBottom: 6 }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          />
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        onPress={saveProfile}
        disabled={saving}
        activeOpacity={0.9}
        style={{
          marginTop: 16,
          backgroundColor: "#ad2bee",
          paddingVertical: 14,
          borderRadius: 16,
          alignItems: "center",
          opacity: saving ? 0.6 : 1,
          shadowColor: "#7430ff",
          shadowOpacity: 0.4,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text
            style={{ color: "white", fontSize: 16, fontWeight: "700" }}
          >
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

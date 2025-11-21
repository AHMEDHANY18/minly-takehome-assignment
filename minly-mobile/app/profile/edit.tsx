// app/profile/edit.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const API_URL = "http://192.168.1.7:4000/v1";

type MeResponse = {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string | null;
  createdAt: string;
  mediaCount: number;
  totalLikesReceived: number;
  totalLikesGiven: number;
};

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [me, setMe] = useState<MeResponse | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [pickedAvatar, setPickedAvatar] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  async function loadMe() {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("token");
      console.log("🔍 TOKEN (edit profile):", token);

      const res = await axios.get(`${API_URL}/user/me`, {
        headers: { Authorization: token || "" },
      });

      const data: MeResponse = res.data?.data;
      console.log("✅ /user/me:", data);

      setMe(data);
      setName(data?.name || "");
      setEmail((data as any)?.email || "");
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // متوافق مع نسختك
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!res.canceled) {
      const asset = res.assets[0];
      console.log("🖼 picked avatar:", asset);
      setPickedAvatar(asset);
    }
  }

  async function saveProfile() {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required");
      return;
    }

    setSaving(true);

    try {
      const token = await SecureStore.getItemAsync("token");
      console.log("🔍 TOKEN before save:", token);

      const form = new FormData();

      // ابعت القيم اللي اتغيرت بس (اختياري)
      form.append("name", name.trim());
      if (email.trim()) form.append("email", email.trim());

      if (pickedAvatar) {
        const fileType = pickedAvatar.mimeType || "image/jpeg";
        const fileName =
          pickedAvatar.fileName || `avatar_${Date.now()}.jpg`;

        // مهم: سيب uri زي ما هو بـ file://
        form.append("file", {
          uri: pickedAvatar.uri,
          name: fileName,
          type: fileType,
        } as any);
      }

      // Debug
      console.log("📦 FORMDATA parts:", (form as any)._parts);

      const res = await axios.patch(`${API_URL}/user`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token || "", // نفس Postman
        },
        transformRequest: (data) => data, // مهم للأندرويد
      });

      console.log("✅ update profile response:", res.data);

      Alert.alert("Success", "Profile updated!");
      router.back(); // يرجع للبروفايل
    } catch (err: any) {
      console.log("❌ update profile error:", err?.response?.data || err);
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Update failed"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: "#f7f6f8" }}>
        <ActivityIndicator size="large" color="#ad2bee" />
      </View>
    );
  }

  if (!me) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Failed to load profile</Text>
      </View>
    );
  }

  const avatarPreview = pickedAvatar?.uri || me.avatarUrl;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#f7f6f8",
        padding: 20,
        paddingTop: 50,
      }}
    >
      {/* Top Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 18,
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 22 }}>✕</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "800" }}>Edit Profile</Text>

        <View style={{ width: 20 }} />
      </View>

      {/* Avatar */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {avatarPreview ? (
          <Image
            source={{ uri: avatarPreview }}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              marginBottom: 10,
              backgroundColor: "#eee",
            }}
          />
        ) : (
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              marginBottom: 10,
              backgroundColor: "#ede9fe",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 32, fontWeight: "900", color: "#6d28d9" }}>
              {me.name?.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={pickAvatar}
          style={{
            backgroundColor: "#ad2bee",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Change Avatar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        Name
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          marginBottom: 14,
        }}
      />

      {/* Email */}
      <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        Email
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Your email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          marginBottom: 22,
        }}
      />

      {/* Save Button */}
      <TouchableOpacity
        onPress={saveProfile}
        disabled={saving}
        style={{
          backgroundColor: "#ad2bee",
          paddingVertical: 14,
          borderRadius: 16,
          alignItems: "center",
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

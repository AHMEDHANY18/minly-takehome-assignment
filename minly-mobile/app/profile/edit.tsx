import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { MediaAPI } from "@/features/media/api/media.api";
import { UserAPI } from "@/features/profile/api/user.api";

/* ---------------- Types ---------------- */

type Picked = {
  uri: string;
  mimeType: string;
  fileName?: string;
};

/* ---------------- Screen ---------------- */

export default function EditProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; avatarUrl?: string }>();

  const initialName = useMemo(() => String(params.name ?? ""), [params.name]);
  const initialAvatarUrl = useMemo(
    () => String(params.avatarUrl ?? ""),
    [params.avatarUrl]
  );

  const [name, setName] = useState(initialName);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);

  const previewAvatar =
    picked?.uri ||
    initialAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}`;

  const canSave =
    !busy &&
    name.trim().length >= 2 &&
    (name.trim() !== initialName.trim() || !!picked);

  /* ---------------- Pick Avatar ---------------- */

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access to photos.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const mime = asset.mimeType || inferMimeType(asset.uri);
    if (!isAllowedAvatarMime(mime)) {
      Alert.alert("Unsupported file", "Only JPG / PNG allowed.");
      return;
    }

    setPicked({
      uri: asset.uri,
      mimeType: mime,
      fileName: asset.fileName ?? asset.uri.split("/").pop(),
    });
  }

  /* ---------------- Save ---------------- */

  async function onSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      Alert.alert("Invalid name", "Name must be at least 2 characters.");
      return;
    }

    setBusy(true);

    try {
      // A) لو فيه صورة: presign -> upload -> finalize (زي الويب)
      if (picked) {
        const presignRes = await MediaAPI.presign({
          kind: "avatar",
          contentType: picked.mimeType,
          // جرّب تشيل type لو الباك “ممنوع هنا” زي تعليق الويب
          // type: "IMAGE",
        });

        const { key, uploadUrl } = presignRes.data.data;

        await uploadToPresignedUrl(uploadUrl, picked.uri, picked.mimeType);

        // ✅ ده المهم
        await MediaAPI.finalize({
          kind: "avatar",
          key,
        });
      }

      // B) الاسم (لو اتغير) حدّثه منفصل
      if (trimmed !== initialName.trim()) {
        await UserAPI.updateMe({ name: trimmed });
      }

      Alert.alert("Saved", "Profile updated successfully.");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to update profile");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} disabled={busy}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image source={{ uri: previewAvatar }} style={styles.avatar} />

          <Pressable
            style={styles.changeBtn}
            onPress={pickAvatar}
            disabled={busy}
          >
            <Ionicons name="camera-outline" size={16} color="#2D7CFF" />
            <Text style={styles.changeText}>Change photo</Text>
          </Pressable>

          {picked && (
            <Pressable onPress={() => setPicked(null)} disabled={busy}>
              <Text style={styles.removeText}>Remove selected photo</Text>
            </Pressable>
          )}
        </View>

        {/* Name */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              editable={!busy}
            />
          </View>
        </View>

        {/* Save */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Pressable
            style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}
            onPress={onSave}
            disabled={!canSave}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- Upload Helper ---------------- */

async function uploadToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string
) {
  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });

  if (![200, 204].includes(result.status)) {
    throw new Error(`Upload failed: ${result.status}`);
  }
}

/* ---------------- Mime Helpers ---------------- */

function isAllowedAvatarMime(m: string) {
  return m === "image/jpeg" || m === "image/png";
}

function inferMimeType(uri: string) {
  if (uri.endsWith(".png")) return "image/png";
  if (uri.endsWith(".jpg") || uri.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 14, fontWeight: "800" },

  avatarSection: { alignItems: "center", paddingVertical: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55 },

  changeBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EAF2FF",
  },
  changeText: { color: "#2D7CFF", fontWeight: "800", fontSize: 12 },

  removeText: { marginTop: 8, fontSize: 12, color: "#667085" },

  label: { fontSize: 12, fontWeight: "800", marginBottom: 6 },
  inputWrap: {
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { fontSize: 12 },

  saveBtn: {
    backgroundColor: "#2D7CFF",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

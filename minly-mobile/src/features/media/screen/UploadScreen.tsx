import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { MediaAPI, MediaType } from "../api/media.api";


type Picked = {
  uri: string;
  mimeType: string;
  mediaType: MediaType;
  fileName?: string;
};

const MAX_DESC = 300;

export default function UploadScreen() {
  const router = useRouter();

  const [picked, setPicked] = useState<Picked | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);

  const desc = useMemo(() => description.slice(0, MAX_DESC), [description]);

  async function pickMedia() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your media library.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: false,
      quality: 1,
      videoExportPreset: ImagePicker.VideoExportPreset.Passthrough,
    });



    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const inferredMime = asset.mimeType || inferMimeType(asset.uri);
    const inferredType = inferMediaType(inferredMime, asset.type);

    if (!isAllowedMime(inferredMime)) {
      Alert.alert("Unsupported file", "Only JPG, PNG, MP4 are supported.");
      return;
    }
    const safeFileName =
    asset.fileName ?? asset.uri.split("/").pop() ?? undefined;

    setPicked({
      uri: asset.uri,
      mimeType: inferredMime,
      mediaType: inferredType,
      fileName: safeFileName
    });
  }

  async function onPost() {
    if (!picked) {
      Alert.alert("Missing media", "Please choose a photo or video first.");
      return;
    }

    setBusy(true);
    try {
      // 1) presign
      const presignRes = await MediaAPI.presign({
        kind: "media",
        contentType: picked.mimeType,
        type: picked.mediaType,
      });

      const { key, uploadUrl } = presignRes.data.data;

      // 2) upload (PUT to S3 presigned)
      await uploadToPresignedUrl(uploadUrl, picked.uri, picked.mimeType);

      // 3) finalize
      const finalizeRes = await MediaAPI.finalize({
        kind: "media",
        key,
        type: picked.mediaType,
        title: title.trim() ? title.trim() : undefined,
        description: desc.trim() ? desc.trim() : undefined,
      });

      const created: any = finalizeRes.data.data;
      const mediaId = created?.id ?? created?.media?.id;

      Alert.alert("Posted", "Your post has been created successfully.");

      // Reset
      setPicked(null);
      setTitle("");
      setDescription("");

      // Navigate (اختياري)
      if (mediaId) {
        // لو عندك route التفاصيل
        // router.replace(`/media/${mediaId}/details`);
        router.back();
      } else {
        router.back();
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Something went wrong while creating the post.";
      Alert.alert("Error", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.h1}>Create new post</Text>
          <Text style={styles.sub}>
            Choose a photo or video to share with your followers.
          </Text>

          {/* Upload box */}
          <Pressable style={styles.uploadBox} onPress={pickMedia}>
            <View style={styles.uploadInner}>
              <View style={styles.cloudCircle}>
                <Ionicons name="cloud-upload-outline" size={22} color="#2D7CFF" />
              </View>

              <Text style={styles.uploadTitle}>
                {picked ? "Media selected" : "Tap to upload media"}
              </Text>

              <Text style={styles.uploadHint}>
                Supports JPG, PNG, MP4
              </Text>

              {picked ? (
                <View style={styles.pickedRow}>
                  <Ionicons
                    name={picked.mediaType === "VIDEO" ? "videocam" : "image"}
                    size={16}
                    color="#111"
                  />
                  <Text style={styles.pickedText} numberOfLines={1}>
                    {picked.fileName || picked.uri.split("/").pop() || picked.mimeType}
                  </Text>

                  <View style={{ flex: 1 }} />
                  <Text style={styles.changeText}>Change</Text>
                </View>
              ) : (
                <View style={styles.browseBtn}>
                  <Text style={styles.browseText}>Browse files</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Title */}
          <Text style={styles.label}>Post Title</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Give your post a catchy title..."
              placeholderTextColor="#98A2B3"
              style={styles.input}
              editable={!busy}
            />
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputWrap, styles.textareaWrap]}>
            <TextInput
              value={desc}
              onChangeText={setDescription}
              placeholder="Tell everyone what this is about..."
              placeholderTextColor="#98A2B3"
              style={[styles.input, styles.textarea]}
              editable={!busy}
              multiline
            />
            <Text style={styles.counter}>{desc.length}/{MAX_DESC}</Text>
          </View>

          {/* Bottom actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => router.back()}
              disabled={busy}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.btnPrimary, (!picked || busy) && { opacity: 0.6 }]}
              onPress={onPost}
              disabled={!picked || busy}
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.btnPrimaryText}>Post</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* -------------------- Upload helpers -------------------- */

async function uploadToPresignedUrl(
  uploadUrl: string,
  fileUri: string,
  contentType: string
) {
  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (result.status !== 200 && result.status !== 204) {
    throw new Error(`Upload failed with status ${result.status}`);
  }
}



function isAllowedMime(m: string) {
  return (
    m === "image/jpeg" ||
    m === "image/jpg" ||
    m === "image/png" ||
    m === "video/mp4"
  );
}

function inferMimeType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".mp4")) return "video/mp4";
  // fallback
  return "application/octet-stream";
}

function inferMediaType(mime: string, pickerType?: string): MediaType {
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("image/")) return "IMAGE";
  // fallback من pickerType
  if (pickerType === "video") return "VIDEO";
  return "IMAGE";
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerTitle: { fontSize: 14, fontWeight: "700", color: "#111" },

  content: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 10 },

  h1: { fontSize: 22, fontWeight: "800", color: "#111" },
  sub: { marginTop: 6, color: "#667085", fontSize: 12, lineHeight: 16 },

  uploadBox: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D0D5DD",
    backgroundColor: "#F9FAFB",
  },
  uploadInner: { paddingVertical: 22, paddingHorizontal: 16, alignItems: "center" },

  cloudCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { marginTop: 10, fontSize: 13, fontWeight: "800", color: "#111" },
  uploadHint: { marginTop: 4, fontSize: 11, color: "#667085" },

  browseBtn: {
    marginTop: 12,
    backgroundColor: "#EAF2FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  browseText: { color: "#2D7CFF", fontWeight: "800", fontSize: 12 },

  pickedRow: {
    marginTop: 14,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EAECF0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pickedText: { maxWidth: 190, color: "#111", fontSize: 12, fontWeight: "600" },
  changeText: { color: "#2D7CFF", fontWeight: "800", fontSize: 12 },

  label: { marginTop: 14, marginBottom: 6, color: "#111", fontWeight: "800", fontSize: 12 },

  inputWrap: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { fontSize: 12, color: "#111" },

  textareaWrap: { minHeight: 110, paddingBottom: 22 },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  counter: { position: "absolute", right: 12, bottom: 8, fontSize: 11, color: "#98A2B3" },

  actions: { flexDirection: "row", gap: 12, marginTop: 18 },
  btn: { flex: 1, borderRadius: 24, paddingVertical: 12, alignItems: "center" },
  btnGhost: { backgroundColor: "#F2F4F7" },
  btnGhostText: { color: "#111", fontWeight: "800" },
  btnPrimary: { backgroundColor: "#2D7CFF" },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
});

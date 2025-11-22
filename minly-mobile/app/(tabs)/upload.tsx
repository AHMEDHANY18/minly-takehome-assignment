import { useState } from "react";
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
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Video, ResizeMode } from "expo-av";

const API_URL = "https://minly-takehome-assignment.onrender.com/v1";

type PickerAsset = ImagePicker.ImagePickerAsset | null;

export default function UploadScreen() {
  const [media, setMedia] = useState<PickerAsset>(null); // image or video
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 1
  const [lastError, setLastError] = useState<string | null>(null);

  const isVideo = media?.type === "video";

  // ==========================
  // Pick Image or Video
  // ==========================
  async function pickMedia() {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!res.canceled) {
        setMedia(res.assets[0]);
        setLastError(null);
      }
    } catch (e) {
      console.log("PICK ERROR:", e);
      Alert.alert("Error", "Failed to open gallery");
    }
  }

  // ==========================
  // Upload
  // ==========================
  async function uploadMedia() {
    if (!media) {
      Alert.alert("Missing media", "Please select an image or video first.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title for your media.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setLastError(null);

    try {
      const token = await SecureStore.getItemAsync("token");
      const form = new FormData();

      form.append("file", {
        uri: media.uri,
        name:
          media.fileName ||
          `upload_${Date.now()}.${isVideo ? "mp4" : "jpg"}`,
        type: isVideo ? "video/mp4" : "image/jpeg",
      } as any);

      form.append("type", isVideo ? "VIDEO" : "IMAGE");
      form.append("title", title);
      form.append("description", description);

      await axios.post(`${API_URL}/media`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token || "",
        },
        // progress (works على React Native XHR)
        onUploadProgress: (event) => {
          if (!event.total) return;
          const pct = event.loaded / event.total;
          setProgress(pct);
        },
        transformRequest: (data) => data,
      });

      Alert.alert("Success", "Uploaded successfully!");
      // reset form
      setMedia(null);
      setTitle("");
      setDescription("");
      setProgress(0);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("UPLOAD ERROR:", err.response?.data || err);
      setLastError(err?.response?.data?.message || "Upload failed");
      Alert.alert("Error", "Upload failed, please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ==========================
  // UI
  // ==========================
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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
          <Text style={{ fontSize: 24 }}>✕</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: "700" }}>New post</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Step indicator */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 40,
            height: 5,
            backgroundColor: "#ad2bee",
            borderRadius: 6,
          }}
        />
        <View
          style={{
            width: 40,
            height: 5,
            backgroundColor: "#e5e7eb",
            borderRadius: 6,
          }}
        />
      </View>

      {/* Media card */}
      <TouchableOpacity
        onPress={pickMedia}
        activeOpacity={0.9}
        style={{
          backgroundColor: "white",
          borderRadius: 18,
          padding: 12,
          marginBottom: 18,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        <View
          style={{
            width: "100%",
            height: 260,
            borderRadius: 14,
            backgroundColor: "#f3f4f6",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {media ? (
            isVideo ? (
              <Video
                source={{ uri: media.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                useNativeControls
              />
            ) : (
              <Image
                source={{ uri: media.uri }}
                style={{ width: "100%", height: "100%" }}
              />
            )
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#9ca3af",
                  marginBottom: 6,
                }}
              >
                Tap to select photo or video
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#d1d5db",
                }}
              >
                Max size depends on your connection
              </Text>
            </View>
          )}
        </View>

        {/* file info */}
        {media && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 10,
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}
              >
                {isVideo ? "Video" : "Photo"}
              </Text>
              {!!media.fileName && (
                <Text style={{ fontSize: 11, color: "#6b7280" }}>
                  {media.fileName}
                </Text>
              )}
            </View>

            {!!media.fileSize && (
              <Text style={{ fontSize: 11, color: "#6b7280" }}>
                {(media.fileSize / (1024 * 1024)).toFixed(1)} MB
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Title */}
      <Text style={{ marginBottom: 6, color: "#4b5563", fontSize: 13 }}>
        Title
      </Text>
      <TextInput
        placeholder="Write a catchy title..."
        placeholderTextColor="#aaa"
        value={title}
        onChangeText={setTitle}
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 16,
          fontSize: 15,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      />

      {/* Description */}
      <Text style={{ marginBottom: 6, color: "#4b5563", fontSize: 13 }}>
        Description
      </Text>
      <TextInput
        placeholder="Say something about this post..."
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          height: 100,
          marginBottom: 16,
          fontSize: 15,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          textAlignVertical: "top",
        }}
      />

      {/* Upload progress */}
      {uploading && (
        <View
          style={{
            marginBottom: 16,
            backgroundColor: "white",
            borderRadius: 14,
            padding: 10,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 6,
              fontWeight: "500",
            }}
          >
            Uploading...
          </Text>
          <View
            style={{
              height: 6,
              borderRadius: 999,
              backgroundColor: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: "#ad2bee",
              }}
            />
          </View>
          <Text
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "#6b7280",
              textAlign: "right",
            }}
          >
            {Math.round(progress * 100)}%
          </Text>
        </View>
      )}

      {/* Last error / retry hint */}
      {lastError && !uploading && (
        <View
          style={{
            backgroundColor: "#fef2f2",
            borderRadius: 12,
            padding: 10,
            borderWidth: 1,
            borderColor: "#fecaca",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: "#b91c1c" }}>{lastError}</Text>
        </View>
      )}

      {/* Buttons */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/home")}
          style={{
            flex: 1,
            backgroundColor: "#e5e7eb",
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
          }}
          disabled={uploading}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827" }}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={uploadMedia}
          disabled={uploading || !media}
          style={{
            flex: 1,
            backgroundColor: "#ad2bee",
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            opacity: uploading || !media ? 0.5 : 1,
          }}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>
              Share
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

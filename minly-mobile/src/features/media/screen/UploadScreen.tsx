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

const API_URL = "https://minly-takehome-assignment.onrender.com/v1";

export default function UploadScreen() {
  const [media, setMedia] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);

  // Pick media
  async function pickMedia() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!res.canceled) {
      setMedia(res.assets[0]);
    }
  }

  // Upload media
  async function uploadMedia() {
    if (!media) return alert("Select image or video first");

    setUploading(true);
    setPercent(0);

    try {
      const token = await SecureStore.getItemAsync("token");
      const isVideo = media.type === "video";

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
          Authorization: token,
        },
        onUploadProgress: (p) => {
          if (p.total) {
            const prog = Math.round((p.loaded / p.total) * 100);
            setPercent(prog);
          }
        },
      });

      alert("Uploaded successfully!");
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("UPLOAD ERROR:", err.response?.data || err);
      Alert.alert("Error", "Upload failed");
    } finally {
      setUploading(false);
    }
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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
          <Text style={{ fontSize: 26 }}>✕</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: "700" }}>New post</Text>

        <View style={{ width: 30 }} />
      </View>

      {/* Step indicator */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 40,
            height: 6,
            backgroundColor: "#ad2bee",
            borderRadius: 6,
          }}
        />
        <View
          style={{
            width: 40,
            height: 6,
            backgroundColor: "#ddd",
            borderRadius: 6,
          }}
        />
      </View>

      {/* Preview */}
      <TouchableOpacity
        onPress={pickMedia}
        style={{
          width: "100%",
          height: 260,
          backgroundColor: "#eee",
          borderRadius: 16,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
        {media ? (
          <Image
            source={{ uri: media.thumbnail || media.uri }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Text style={{ color: "#999" }}>Tap to select media</Text>
        )}
      </TouchableOpacity>

      {/* Title */}
      <Text style={{ marginBottom: 6, color: "#4b5563", fontSize: 13 }}>
        Title
      </Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Work"
        placeholderTextColor="#aaa"
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        }}
      />

      {/* Description */}
      <Text style={{ marginBottom: 6, color: "#4b5563", fontSize: 13 }}>
        Description
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Say something about this post..."
        placeholderTextColor="#aaa"
        multiline
        style={{
          backgroundColor: "white",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 10,
          height: 100,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          textAlignVertical: "top",
        }}
      />

      {/* Progress Bar */}
      {uploading && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ marginBottom: 6 }}>Uploading...</Text>
          <View
            style={{
              width: "100%",
              height: 8,
              borderRadius: 999,
              backgroundColor: "#eee",
            }}
          >
            <View
              style={{
                width: `${percent}%`,
                height: "100%",
                borderRadius: 999,
                backgroundColor: "#ad2bee",
              }}
            />
          </View>
          <Text style={{ textAlign: "right", marginTop: 4 }}>
            {percent}%
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/home")}
          style={{
            flex: 1,
            backgroundColor: "#ddd",
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={uploadMedia}
          disabled={uploading}
          style={{
            flex: 1,
            backgroundColor: "#ad2bee",
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: "center",
            opacity: uploading ? 0.5 : 1,
          }}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>
              Upload
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

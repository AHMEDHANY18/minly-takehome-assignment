// src/features/media/screen/EditMediaScreen.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { MediaAPI } from "@/features/media/api/media.api";

export default function EditMediaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    description?: string;
    url?: string;
    type?: string;
  }>();

  const mediaId = String(params.id ?? "");

  const [title, setTitle] = useState(String(params.title ?? ""));
  const [description, setDescription] = useState(String(params.description ?? ""));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!mediaId || saving) return;

    setSaving(true);
    try {
      // PATCH /media/:id — backend re-syncs #hashtags from title+description
      await MediaAPI.update(mediaId, {
        title: title.trim(),
        description: description.trim(),
      });
      router.back();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "Failed to update media"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.shell}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable hitSlop={10} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#111" />
            </Pressable>

            <Text style={styles.headerTitle}>EDIT POST</Text>

            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            style={styles.card}
            contentContainerStyle={{ padding: 14, gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {params.url ? (
              <Image source={{ uri: String(params.url) }} style={styles.preview} />
            ) : null}

            <View>
              <Text style={styles.label}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#9AA0AA"
                style={styles.input}
                maxLength={120}
              />
            </View>

            <View>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Description (#hashtags supported)"
                placeholderTextColor="#9AA0AA"
                style={[styles.input, styles.inputMultiline]}
                multiline
                maxLength={500}
              />
            </View>

            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={save}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F2F2F4" },
  shell: { flex: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ECECF1",
  },
  headerTitle: { fontSize: 12, fontWeight: "900", color: "#111", letterSpacing: 1 },

  card: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECF1",
    flex: 1,
  },

  preview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#F3F4F7",
  },

  label: { fontSize: 12, color: "#4b5563", marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },

  saveBtn: {
    marginTop: 4,
    backgroundColor: "#2D7CFF",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800" },
});

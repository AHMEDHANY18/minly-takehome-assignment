// src/features/social/components/ReportModal.tsx
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  ReportAPI,
  type ReportReason,
  type ReportTargetType,
} from "../api/report.api";

const REASONS: { key: ReportReason; label: string }[] = [
  { key: "SPAM", label: "Spam" },
  { key: "ABUSE", label: "Abuse or harassment" },
  { key: "INAPPROPRIATE", label: "Inappropriate content" },
  { key: "OTHER", label: "Other" },
];

type Props = {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
};

export function ReportModal({ visible, targetType, targetId, onClose }: Props) {
  const [busy, setBusy] = useState(false);

  const submit = async (reason: ReportReason) => {
    if (busy) return;
    setBusy(true);

    try {
      await ReportAPI.create({ targetType, targetId, reason });
      onClose();
      Alert.alert("Report sent", "Thanks for letting us know.");
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? e?.message ?? "Failed to send report"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* stop propagation so taps inside don't close */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>Report</Text>
          <Text style={styles.sub}>Why are you reporting this?</Text>

          {REASONS.map((r) => (
            <Pressable
              key={r.key}
              style={styles.row}
              disabled={busy}
              onPress={() => submit(r.key)}
            >
              <Ionicons name="flag-outline" size={16} color="#111" />
              <Text style={styles.rowText}>{r.label}</Text>
            </Pressable>
          ))}

          <Pressable style={styles.cancel} onPress={onClose} disabled={busy}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
  },
  title: { fontSize: 15, fontWeight: "900", color: "#111" },
  sub: { marginTop: 4, marginBottom: 10, fontSize: 12, color: "#6B7280" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F1F4",
  },
  rowText: { fontSize: 13, fontWeight: "600", color: "#111" },

  cancel: {
    marginTop: 10,
    backgroundColor: "#F1F3F7",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "800", color: "#111" },
});

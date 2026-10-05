// components/auth/ForgotPasswordModal.tsx
import { API_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (username?: string, newPassword?: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ Gmail của bạn");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      Alert.alert("Lỗi định dạng", "Vui lòng nhập đúng định dạng Gmail (VD: tenban@gmail.com)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Lỗi đặt lại mật khẩu (${res.status})`);
      }

      Alert.alert(
        "Cấp lại mật khẩu thành công 🎉",
        `Hệ thống đã tạo mật khẩu mới cho tài khoản "${data.username || "của bạn"}":\n\n👉 Mật khẩu mới: ${data.newPassword}\n\n(Hệ thống đã gửi mật khẩu này tới hộp thư Gmail ${cleanEmail}). Vui lòng lưu lại và dùng mật khẩu này để đăng nhập ngay!`,
        [
          {
            text: "Đăng nhập ngay",
            onPress: () => {
              if (onSuccess) {
                onSuccess(data.username, data.newPassword);
              }
              setEmail("");
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("Forgot password error:", err);
      Alert.alert("Không thành công", err.message || "Không thể đặt lại mật khẩu vào lúc này");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-unread-outline" size={26} color="#d97706" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Quên Mật Khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập địa chỉ Gmail bạn đã dùng khi đăng ký tài khoản. Hệ thống sẽ tạo mật khẩu mới an toàn và gửi về hòm thư Gmail để bạn đăng nhập.
          </Text>

          {/* INPUT GMAIL */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Địa chỉ Gmail đã đăng ký</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="VD: example@gmail.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          {/* BUTTONS */}
          <TouchableOpacity
            style={[styles.btnSubmit, loading && styles.btnDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={styles.btnSubmitText}>Gửi Mật Khẩu Mới Qua Gmail</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnBack} onPress={onClose} disabled={loading}>
            <Text style={styles.btnBackText}>Quay lại Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
  },
  btnClose: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1f2937",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: "#1f2937",
  },
  btnSubmit: {
    backgroundColor: "#d97706",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
  },
  btnSubmitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  btnBack: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
  },
  btnBackText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
  },
});

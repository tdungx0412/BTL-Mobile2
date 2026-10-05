// components/account/EditProfileModal.tsx
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (updatedUser: any) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setNewPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên của bạn");
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim().toLowerCase())) {
        Alert.alert("Lỗi định dạng", "Địa chỉ Gmail không hợp lệ (VD: tenban@gmail.com)");
        return;
      }
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        Alert.alert("Lỗi mật khẩu", "Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Lỗi mật khẩu", "Mật khẩu xác nhận không khớp với mật khẩu mới");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || user?.user_id,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          new_password: newPassword ? newPassword.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Cập nhật thất bại (${res.status})`);
      }

      const updated = data.user || {
        ...user,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      };

      await updateUser(updated);

      Alert.alert("Thành công 🎉", "Thông tin tài khoản đã được cập nhật thành công!", [
        {
          text: "Đồng ý",
          onPress: () => {
            if (onSuccess) onSuccess(updated);
            onClose();
          },
        },
      ]);
    } catch (err: any) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      Alert.alert("Lỗi", err.message || "Không thể cập nhật thông tin lúc này");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="create-outline" size={22} color="#d97706" />
              </View>
              <View>
                <Text style={styles.title}>Chỉnh Sửa Tài Khoản</Text>
                <Text style={styles.subtitle}>@{user?.username} ({user?.role === "admin" ? "Quản trị viên" : "Khách hàng"})</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* FULL NAME */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Họ và tên <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên của bạn"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* GMAIL / EMAIL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Địa chỉ Gmail <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="VD: vidu@gmail.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <Text style={styles.hintText}>
                💡 Gmail dùng để nhận mật khẩu mới khi bạn quên mật khẩu.
              </Text>
            </View>

            {/* PHONE */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="VD: 0912345678"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>

            {/* SECTION: ĐỔI MẬT KHẨU */}
            <View style={styles.passwordSection}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Ionicons name="key-outline" size={18} color="#d97706" />
                <Text style={styles.sectionHeading}>Đổi Mật Khẩu (Để trống nếu không đổi)</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mật khẩu mới (từ 6 ký tự)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Nhập mật khẩu mới..."
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {newPassword.length > 0 && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Nhập lại mật khẩu mới..."
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={loading}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnSave, loading && styles.btnDisabled]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.btnSaveText}>Lưu Thay Đổi</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  btnClose: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  required: {
    color: "#dc2626",
  },
  hintText: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 4,
    marginLeft: 2,
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
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  passwordSection: {
    backgroundColor: "#fffdf5",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b45309",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4b5563",
  },
  btnSave: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#d97706",
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
  btnSaveText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
});

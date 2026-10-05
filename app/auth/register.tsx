import { API_URL } from "@/constants/config";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // VALIDATION FUNCTIONS
  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên đăng nhập");
      return false;
    }

    if (username.trim().length < 4) {
      Alert.alert("Lỗi", "Tên đăng nhập phải có ít nhất 4 ký tự");
      return false;
    }

    if (!fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên");
      return false;
    }

    // BẮT BUỘC PHẢI CÓ GMAIL
    if (!email.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ Gmail để đăng ký tài khoản");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      Alert.alert(
        "Lỗi định dạng Gmail",
        "Vui lòng nhập đúng định dạng Gmail (VD: example@gmail.com)"
      );
      return false;
    }

    if (!password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mật khẩu");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`Máy chủ phản hồi lỗi (${res.status}). Vui lòng thử lại sau.`);
      }

      if (!res.ok) {
        throw new Error(data.message || `Đăng ký thất bại (${res.status})`);
      }

      Alert.alert(
        "Đăng ký thành công 🎉",
        `Chào mừng ${fullName.trim()}! Tài khoản của bạn đã được khởi tạo. Bạn có thể sử dụng Gmail "${email.trim().toLowerCase()}" để khôi phục mật khẩu nếu lỡ quên sau này.`,
        [{ text: "Đăng nhập ngay", onPress: () => router.replace("/auth/login") }]
      );
    } catch (err: any) {
      console.error("Register error:", err);
      Alert.alert("Đăng ký thất bại", err.message || "Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={38} color="#d97706" />
          </View>
          <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để mua sắm & tích lũy ưu đãi Eiko</Text>
        </View>

        {/* NOTICE BOX */}
        <View style={styles.noticeBox}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Ionicons name="information-circle" size={20} color="#d97706" />
            <Text style={styles.noticeTitle}>Yêu cầu bắt buộc Gmail</Text>
          </View>
          <Text style={styles.noticeText}>
            Vui lòng nhập chính xác địa chỉ Gmail của bạn. Khi quên mật khẩu, hệ thống sẽ cấp và gửi mật khẩu mới về Gmail này để bạn đăng nhập.
          </Text>
        </View>

        {/* USERNAME */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Tên đăng nhập <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="Ít nhất 4 ký tự (VD: dung_tran, eiko_01)"
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={setUsername}
              style={styles.textInput}
              autoCapitalize="none"
              autoComplete="username"
            />
          </View>
        </View>

        {/* FULL NAME */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Họ và tên <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="id-card-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="VD: Trần Trung Dũng"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
              style={styles.textInput}
            />
          </View>
        </View>

        {/* GMAIL (BẮT BUỘC) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Địa chỉ Gmail <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#d97706" style={styles.inputIcon} />
            <TextInput
              placeholder="VD: email_cua_ban@gmail.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* PHONE */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại (Nhận hàng)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="VD: 0987654321"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.textInput}
            />
          </View>
        </View>

        {/* PASSWORD */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Mật khẩu <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="Ít nhất 6 ký tự"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.textInput}
              autoComplete="new-password"
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

        {/* CONFIRM PASSWORD */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Xác nhận mật khẩu <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="Nhập lại mật khẩu ở trên"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              style={styles.textInput}
              autoComplete="new-password"
            />
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={[styles.btnRegister, loading && styles.btnDisabled]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.btnRegisterText}>Hoàn Tất Đăng Ký</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* BACK TO LOGIN */}
        <TouchableOpacity
          onPress={() => router.replace("/auth/login")}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Đã có tài khoản? <Text style={{ color: "#d97706", fontWeight: "700" }}>Đăng nhập ngay</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1f2937",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  noticeBox: {
    backgroundColor: "#fffbeb",
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400e",
  },
  noticeText: {
    fontSize: 12,
    color: "#78350f",
    marginTop: 4,
    lineHeight: 18,
  },
  formGroup: {
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
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  btnRegister: {
    backgroundColor: "#d97706",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
  },
  btnRegisterText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  loginLink: {
    marginTop: 18,
    alignItems: "center",
    paddingVertical: 6,
  },
  loginLinkText: {
    color: "#6b7280",
    fontSize: 14,
  },
});

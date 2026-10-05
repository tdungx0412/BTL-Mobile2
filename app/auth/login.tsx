// app/auth/login.tsx
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { API_URL } from "@/constants/config";
import { useAuthStore } from "@/src/stores/useAuthStore";
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

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();


  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Máy chủ phản hồi lỗi (${res.status}). Vui lòng kiểm tra backend.`);
      }

      if (!res.ok) {
        throw new Error(data.message || `Đăng nhập thất bại (${res.status})`);
      }

      // LƯU USER INFO VÀO ASYNCSTORAGE VÀ ZUSTAND STORE
      const userId = data.id || data.user_id;
      const userData = {
        id: userId,
        user_id: userId,
        token: data.token || `token_${userId}`,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
        email: data.email,
      };

      await useAuthStore.getState().login(userData as any, userData.token);

      if (data.is_new_customer) {
        Alert.alert(
          "Chào mừng bạn mới 🎉",
          `Hệ thống đã tự động tạo tài khoản khách hàng "${data.username}" cho bạn. Chúc bạn mua sắm vui vẻ!`,
          [{ text: "Bắt đầu mua sắm", onPress: () => router.replace("/(tabs)") }]
        );
      } else {
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = err.message || "Không thể kết nối đến server";
      if (msg.includes("Network request failed")) {
        msg = `Không thể kết nối tới máy chủ (${API_URL}). Vui lòng kiểm tra Wi-Fi và backend.`;
      }
      Alert.alert("Đăng nhập thất bại", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestQuickLogin = async () => {
    setGuestLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Lỗi tạo tài khoản khách vãng lai");
      }

      const userId = data.id || data.user_id;
      const userData = {
        id: userId,
        user_id: userId,
        token: data.token || `token_${userId}`,
        username: data.username,
        full_name: data.full_name,
        role: data.role,
      };

      await useAuthStore.getState().login(userData as any, userData.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể vào nhanh bằng tài khoản khách");
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* LOGO & TITLE */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="basket" size={44} color="#d97706" />
          </View>
          <Text style={styles.title}>Eiko Handcraft</Text>
          <Text style={styles.subtitle}>Đồ thủ công & Quà tặng tinh hoa Việt Nam</Text>
        </View>

        {/* SMART LOGIN HIGHLIGHT BANNER */}
        <View style={styles.noticeBox}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Ionicons name="sparkles" size={20} color="#d97706" />
            <Text style={styles.noticeTitle}>Đăng Nhập Khách Mua Hàng</Text>
          </View>
          <Text style={styles.noticeText}>
            💡 Nhập tên đăng nhập & mật khẩu mong muốn. Nếu tài khoản chưa tồn tại, hệ thống sẽ{" "}
            <Text style={{ fontWeight: "700", color: "#b45309" }}>tự động tạo tài khoản khách</Text> cho bạn ngay lập tức!
          </Text>
        </View>

        {/* INPUTS */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Tên đăng nhập</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="VD: khachhang01, dung123..."
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={setUsername}
              style={styles.textInput}
              autoCapitalize="none"
              autoComplete="username"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Mật khẩu</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              placeholder="Nhập mật khẩu (từ 4 ký tự)"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.textInput}
              autoComplete="current-password"
            />
          </View>
        </View>

        {/* FORGOT PASSWORD LINK */}
        <View style={styles.forgotPasswordRow}>
          <TouchableOpacity
            onPress={() => setShowForgotPassword(true)}
            activeOpacity={0.7}
            style={{ paddingVertical: 4 }}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading || guestLoading}
          style={[styles.btnLogin, loading && styles.btnDisabled]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.btnLoginText}>Đăng Nhập / Vào Mua Hàng</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>HOẶC</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 1-TAP GUEST LOGIN */}
        <TouchableOpacity
          onPress={handleGuestQuickLogin}
          disabled={loading || guestLoading}
          style={styles.btnGuest}
          activeOpacity={0.8}
        >
          {guestLoading ? (
            <ActivityIndicator color="#d97706" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="flash" size={18} color="#d97706" />
              <Text style={styles.btnGuestText}>Vào Nhanh Với Tài Khoản Khách (1 Chạm)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* REGISTER LINK */}
        <TouchableOpacity
          onPress={() => router.push("/auth/register")}
          style={styles.registerLink}
        >
          <Text style={styles.registerLinkText}>
            Chưa có tài khoản? <Text style={{ color: "#d97706", fontWeight: "700" }}>Đăng ký ngay với Gmail</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL QUÊN MẬT KHẨU QUA GMAIL */}
      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={(uname, newPw) => {
          if (uname) setUsername(uname);
          if (newPw) setPassword(newPw);
        }}
      />
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#fde68a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
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
    fontSize: 14,
    fontWeight: "800",
    color: "#92400e",
  },
  noticeText: {
    fontSize: 12,
    color: "#78350f",
    marginTop: 6,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
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
  textInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: "#1f2937",
  },
  btnLogin: {
    backgroundColor: "#d97706",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
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
  btnLoginText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
  },
  btnGuest: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#d97706",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnGuestText: {
    color: "#d97706",
    fontWeight: "800",
    fontSize: 14,
  },
  registerLink: {
    marginTop: 18,
    alignItems: "center",
  },
  registerLinkText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  forgotPasswordRow: {
    alignItems: "flex-end",
    marginBottom: 14,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: "#d97706",
    fontSize: 13,
    fontWeight: "700",
  },
});


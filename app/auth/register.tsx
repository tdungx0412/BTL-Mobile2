// app/auth/register.tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // VALIDATION FUNCTIONS
  const validateForm = () => {
    if (!username.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên đăng nhập");
      return false;
    }

    if (username.length < 4) {
      Alert.alert("Lỗi", "Tên đăng nhập phải có ít nhất 4 ký tự");
      return false;
    }

    if (!fullName.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ và tên");
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      Alert.alert("Thành công", "Đăng ký thành công! Vui lòng đăng nhập.", [
        { text: "OK", onPress: () => router.replace("/auth/login") },
      ]);
    } catch (err: any) {
      console.error("Register error:", err);
      Alert.alert(
        "Đăng ký thất bại",
        err.message || "Không thể kết nối đến server",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flex: 1 }}
      style={{ backgroundColor: "#fff" }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 32,
            textAlign: "center",
            color: "#1f2937",
          }}
        >
          Đăng Ký Tài Khoản
        </Text>

        <TextInput
          placeholder="Tên đăng nhập (ít nhất 4 ký tự)"
          value={username}
          onChangeText={setUsername}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
          autoCapitalize="none"
          autoComplete="username"
        />

        <TextInput
          placeholder="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        />

        <TextInput
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
          autoComplete="new-password"
        />

        <TextInput
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
          }}
          autoComplete="new-password"
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#a8a8a8" : "#d97706",
            padding: 14,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Đăng Ký
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#6b7280" }}>
            Đã có tài khoản? Đăng nhập ngay
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
